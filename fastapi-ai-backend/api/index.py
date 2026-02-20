import os
import sys


# Ensure project root is importable when running as a Vercel function.
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from main import app  # noqa: E402

