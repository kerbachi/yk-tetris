#!/usr/bin/env python3
"""Generate the yk-tetris app icon (build/icon.png and build/icon.ico).

Draws a colorful T-tetromino on a dark rounded panel that matches the game's
palette. Re-run with `python3 scripts/make-icon.py` to regenerate the assets.
"""
import os
from PIL import Image, ImageDraw

SIZE = 1024
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
    box = [x + pad, y + pad, x + size - pad, y + size - pad]
    draw.rounded_rectangle(box, radius=radius, fill=darken(color, 0.15))
    inset = size * 0.12
    inner = [x + inset, y + inset, x + size - inset, y + size - inset]
    draw.rounded_rectangle(inner, radius=radius * 0.8, fill=color)
    # Top-left highlight strip for a subtle 3D feel.
    hl = [x + inset, y + inset, x + size - inset, y + inset + size * 0.16]
    draw.rounded_rectangle(hl, radius=radius * 0.6, fill=lighten(color, 0.35))


def main():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = 48
    draw.rounded_rectangle(
        [margin, margin, SIZE - margin, SIZE - margin],
        radius=180,
        fill=BG,
        outline=BORDER,
        width=14,
    )

    cols, rows = 3, 2
    block = 236
    grid_w, grid_h = cols * block, rows * block
    start_x = (SIZE - grid_w) // 2
    start_y = (SIZE - grid_h) // 2 + 12

    for col, row, color in CELLS:
        draw_block(draw, start_x + col * block, start_y + row * block, block, color)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "build")
    os.makedirs(out_dir, exist_ok=True)
    png_path = os.path.join(out_dir, "icon.png")
    ico_path = os.path.join(out_dir, "icon.ico")

    img.save(png_path)
    img.save(
        ico_path,
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    print("wrote", png_path, "and", ico_path)


if __name__ == "__main__":
    main()
