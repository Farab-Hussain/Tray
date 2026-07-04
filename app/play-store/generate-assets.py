#!/usr/bin/env python3
"""Generate Google Play feature graphic (1024x500) for FairChance."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ICON_SRC = (
    ROOT.parent
    / "ios/app/Images.xcassets/AppIcon.appiconset/icon-1024-1x.png"
)
OUT = ROOT / "graphics/feature-graphic-1024x500.png"

WIDTH, HEIGHT = 1024, 500
GREEN_TOP = (46, 125, 50)  # #2E7D32
GREEN_BOTTOM = (96, 193, 105)  # #60C169
YELLOW = (255, 203, 75)  # #FFCB4B
WHITE = (255, 255, 255)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_gradient(draw: ImageDraw.ImageDraw) -> None:
    for y in range(HEIGHT):
        ratio = y / max(HEIGHT - 1, 1)
        color = tuple(
            int(GREEN_TOP[i] * (1 - ratio) + GREEN_BOTTOM[i] * ratio) for i in range(3)
        )
        draw.line([(0, y), (WIDTH, y)], fill=color)


def main() -> None:
    canvas = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(canvas)
    draw_gradient(draw)

    icon = Image.open(ICON_SRC).convert("RGBA")
    icon_size = 300
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)

    card_padding = 22
    card_size = icon_size + card_padding * 2
    card_x = 72
    card_y = (HEIGHT - card_size) // 2
    draw.rounded_rectangle(
        (card_x, card_y, card_x + card_size, card_y + card_size),
        radius=28,
        fill=WHITE,
    )
    canvas.paste(icon, (card_x + card_padding, card_y + card_padding), icon)

    title_font = load_font(72, bold=True)
    tagline_font = load_font(34, bold=False)
    subtitle_font = load_font(26, bold=False)

    text_x = card_x + card_size + 56
    title = "FairChance"
    tagline = "Connect. Learn. Grow."
    subtitle = "Find opportunities. Connect with experts."

    draw.text((text_x, 148), title, font=title_font, fill=WHITE)
    draw.text((text_x, 238), tagline, font=tagline_font, fill=YELLOW)
    draw.text((text_x, 296), subtitle, font=subtitle_font, fill=(230, 255, 230))

    # Subtle decorative rays echoing the app icon
    ray_color = (255, 230, 120, 90)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    cx, cy = card_x + card_size // 2, card_y + card_size // 2
    for angle in range(-60, 61, 20):
        import math

        rad = math.radians(angle - 90)
        x2 = cx + int(math.cos(rad) * 420)
        y2 = cy + int(math.sin(rad) * 420)
        overlay_draw.line([(cx, cy), (x2, y2)], fill=ray_color, width=6)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, format="PNG", optimize=True)
    print(f"Wrote {OUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
