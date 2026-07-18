#!/usr/bin/env python3
"""Generate the yk-tetris icons.

Writes:
- build/icon.png, build/icon.ico  — desktop app + installer icons (spacious).
- public/favicon.png, public/favicon.ico — web favicons (compact, so the colored
  blocks stay recognizable at tiny tab sizes).

Re-run with `python3 scripts/make-icon.py` (or `npm run icon`).
"""
import os
from PIL import Image, ImageDraw

BG = (18, 20, 43, 255)          # dark navy panel
BORDER = (98, 208, 255, 255)    # cyan accent (matches --accent)

# Game palette (from src/game/pieces.ts).
CYAN = (74, 215, 255, 255)
PURPLE = (201, 100, 255, 255)
GREEN = (87, 224, 138, 255)
ORANGE = (255, 157, 74, 255)

# T-tetromino: three across the top, one centered below.
CELLS = [
    (0, 0, CYAN),
    (1, 0, PURPLE),
    (2, 0, GREEN),
    (1, 1, ORANGE),
]


def lighten(color, amount):
    r, g, b, a = color
    return (
        min(255, int(r + (255 - r) * amount)),
        min(255, int(g + (255 - g) * amount)),
        min(255, int(b + (255 - b) * amount)),
        a,
    )


def darken(color, amount):
    r, g, b, a = color
    return (int(r * (1 - amount)), int(g * (1 - amount)), int(b * (1 - amount)), a)


def draw_block(draw, x, y, size, color):
    pad = size * 0.07
    radius = size * 0.16
    draw.rounded_rectangle(
        [x + pad, y + pad, x + size - pad, y + size - pad],
        radius=radius,
        fill=darken(color, 0.15),
    )
    inset = size * 0.12
    draw.rounded_rectangle(
        [x + inset, y + inset, x + size - inset, y + size - inset],
        radius=radius * 0.8,
        fill=color,
    )
    draw.rounded_rectangle(
        [x + inset, y + inset, x + size - inset, y + inset + size * 0.16],
        radius=radius * 0.6,
        fill=lighten(color, 0.35),
    )


def render(size=1024, compact=False):
    """Render the icon. `compact` fills more of the frame for small favicons."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = size * (0.03 if compact else 0.047)
    bg_radius = size * (0.16 if compact else 0.176)
    border = max(2, int(size * (0.02 if compact else 0.0137)))
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=bg_radius,
        fill=BG,
        outline=BORDER,
        width=border,
    )

    cols, rows = 3, 2
    # Compact leaves less breathing room so the blocks dominate the frame.
    grid_ratio = 0.86 if compact else 0.7
    block = (size * grid_ratio) / cols
    grid_w, grid_h = cols * block, rows * block
    start_x = (size - grid_w) / 2
    start_y = (size - grid_h) / 2 + size * 0.012

    for col, row, color in CELLS:
        draw_block(draw, start_x + col * block, start_y + row * block, block, color)

    return img


def main():
    root = os.path.join(os.path.dirname(__file__), "..")
    out_dir = os.path.join(root, "build")
    public_dir = os.path.join(root, "public")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # electron-builder resources (desktop app + installers).
    app_icon = render(1024, compact=False)
    png_path = os.path.join(out_dir, "icon.png")
    ico_path = os.path.join(out_dir, "icon.ico")
    app_icon.save(png_path)
    app_icon.save(
        ico_path,
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )

    # Web favicons (compact so they read well in a browser tab).
    favicon = render(256, compact=True)
    favicon_png = os.path.join(public_dir, "favicon.png")
    favicon_ico = os.path.join(public_dir, "favicon.ico")
    favicon.save(favicon_png)
    favicon.save(favicon_ico, sizes=[(48, 48), (32, 32), (16, 16)])

    print("wrote", png_path, ico_path, favicon_png, favicon_ico)


if __name__ == "__main__":
    main()
