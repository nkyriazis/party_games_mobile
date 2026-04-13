#!/usr/bin/env python3
"""Split resources/icons.png into 3 individual icon files.

icon-1 = multi-game  → resources/icon-only.png (1024×1024, Android launcher)
icon-2 = tick-tack-boom → public/icon-tick-tack-boom.png
icon-3 = taboo          → public/icon-taboo.png
"""

from PIL import Image, ImageChops
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "resources" / "icons.png"
OUT = ROOT / "resources"
PUB = ROOT / "public"

# Loose crop boxes separating the 3 icons (derived from inter-icon background gaps)
ICONS = [
    ("icon-1", (119, 0, 920, 1536)),
    ("icon-2", (1007, 0, 1809, 1536)),
    ("icon-3", (1897, 0, 2704, 1536)),
]

MARGIN = 5

img = Image.open(SRC).convert("RGB")
r, g, b = img.split()

# Purple background detection: high R, low G, high B.
# Tolerant thresholds handle anti-aliasing / compressed edges.
r_bg = r.point(lambda v: 255 if v > 140 else 0)
g_bg = g.point(lambda v: 255 if v < 130 else 0)
b_bg = b.point(lambda v: 255 if v > 140 else 0)

# bg_mask: white where pixel is purple background, black where it is content
bg_mask = ImageChops.multiply(ImageChops.multiply(r_bg, g_bg), b_bg)
content_mask = ImageChops.invert(bg_mask)

for idx, (name, box) in enumerate(ICONS, 1):
    x1, y1, x2, y2 = box
    h = y2 - y1
    trim = int(h * 0.15)
    scan_box = (x1, y1 + trim, x2, y2 - trim)
    region = content_mask.crop(scan_box)
    bbox = region.getbbox()  # tight bounding box of non-zero pixels
    if bbox is None:
        print(f"WARNING: no content found in {name} region, skipping")
        continue
    # Translate bbox back to full-image coordinates, add margin (clamped to image)
    iw, ih = img.size
    abs_box = (
        max(0, x1 + bbox[0] - MARGIN),
        max(0, scan_box[1] + bbox[1] - MARGIN),
        min(iw, x1 + bbox[2] + MARGIN),
        min(ih, scan_box[1] + bbox[3] + MARGIN),
    )
    cropped = img.crop(abs_box).convert("RGBA")

    # Replace purple background pixels with transparency
    cr, cg, cb, ca = cropped.split()
    is_r = cr.point(lambda v: 255 if v > 140 else 0)
    is_g = cg.point(lambda v: 255 if v < 130 else 0)
    is_b = cb.point(lambda v: 255 if v > 140 else 0)
    purple = ImageChops.multiply(ImageChops.multiply(is_r, is_g), is_b)
    alpha = ImageChops.subtract(Image.new("L", cropped.size, 255), purple)
    cropped.putalpha(alpha)

    # --- Route each icon to its final destination(s) ---
    if idx == 1:
        # Multi-game → Android launcher icon (1024×1024, letterboxed, transparent bg)
        launcher = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        cw, ch = cropped.size
        scale = min(1024 / cw, 1024 / ch)
        new_size = (int(cw * scale), int(ch * scale))
        resized = cropped.resize(new_size, Image.LANCZOS)
        offset = ((1024 - new_size[0]) // 2, (1024 - new_size[1]) // 2)
        launcher.paste(resized, offset, resized)
        dest = OUT / "icon-only.png"
        launcher.save(dest)
        print(f"Saved {dest}  (1024x1024  launcher icon)")
        # Also save as raw crop for reference
        (OUT / "icon-1.png").unlink(missing_ok=True)

    elif idx == 2:
        dest = PUB / "icon-tick-tack-boom.png"
        cropped.save(dest)
        print(f"Saved {dest}  ({cropped.size[0]}x{cropped.size[1]})")

    elif idx == 3:
        dest = PUB / "icon-taboo.png"
        cropped.save(dest)
        print(f"Saved {dest}  ({cropped.size[0]}x{cropped.size[1]})")
