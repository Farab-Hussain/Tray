# Google Play Store listing assets

Upload these files in **Play Console → Grow → Store presence → Main store listing → Graphics**.

| File | Size | Play Console field |
|------|------|-------------------|
| `graphics/app-icon-512.png` | 512 × 512 | **App icon** |
| `graphics/feature-graphic-1024x500.png` | 1024 × 500 | **Feature graphic** |

## Upload steps

1. Open [Google Play Console](https://play.google.com/console) → your app → **Main store listing**.
2. Under **Graphics**, upload `app-icon-512.png` as **App icon**.
3. Upload `feature-graphic-1024x500.png` as **Feature graphic**.
4. Click **Save**. Listing updates may take a few minutes to several hours.

## Regenerate

```bash
# App icon (from iOS 1024 source)
sips -z 512 512 ios/app/Images.xcassets/AppIcon.appiconset/icon-1024-1x.png \
  --out play-store/graphics/app-icon-512.png

# Feature banner
python3 play-store/generate-assets.py
```

These assets are for the **store listing only**. On-device launcher icons remain in `android/app/src/main/res/mipmap-*/`.
