#!/usr/bin/env python3
"""Generate placeholder thumbnails for demo scans"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create thumbnails directory
thumbnails_dir = "demo-resources/thumbnails"
os.makedirs(thumbnails_dir, exist_ok=True)

# Define thumbnail specs for each scan
thumbnails = [
    {
        "name": "dollhouse",
        "color": (100, 150, 255),  # Blue
        "text": "Dollhouse\nFirst Floor",
        "filename": "demoscan-dollhouse-thumb.jpg"
    },
    {
        "name": "fachada",
        "color": (255, 150, 100),  # Orange
        "text": "Building\nFacade",
        "filename": "demoscan-fachada-thumb.jpg"
    },
    {
        "name": "tiangulos",
        "color": (150, 255, 150),  # Green
        "text": "Interior\nScan",
        "filename": "demoscan-tiangulos-thumb.jpg"
    }
]

# Generate each thumbnail
for thumb in thumbnails:
    # Create image with gradient
    img = Image.new('RGB', (800, 600), thumb['color'])
    draw = ImageDraw.Draw(img)
    
    # Add darker gradient at bottom
    for y in range(600):
        factor = y / 600
        darker = tuple(int(c * (1 - factor * 0.4)) for c in thumb['color'])
        draw.line([(0, y), (800, y)], fill=darker)
    
    # Add grid pattern
    for x in range(0, 800, 100):
        draw.line([(x, 0), (x, 600)], fill=tuple(int(c * 0.9) for c in thumb['color']), width=1)
    for y in range(0, 600, 100):
        draw.line([(0, y), (800, y)], fill=tuple(int(c * 0.9) for c in thumb['color']), width=1)
    
    # Add text
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
        small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw text with shadow
    text = thumb['text']
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    text_x = (800 - text_width) // 2
    text_y = (600 - text_height) // 2
    
    # Shadow
    draw.text((text_x + 3, text_y + 3), text, fill=(0, 0, 0, 128), font=font, align='center')
    # Main text
    draw.text((text_x, text_y), text, fill=(255, 255, 255), font=font, align='center')
    
    # Add "3D Scan" label
    label = "3D SCAN"
    label_bbox = draw.textbbox((0, 0), label, font=small_font)
    label_width = label_bbox[2] - label_bbox[0]
    draw.text(((800 - label_width) // 2, 50), label, fill=(255, 255, 255, 200), font=small_font)
    
    # Save thumbnail
    output_path = os.path.join(thumbnails_dir, thumb['filename'])
    img.save(output_path, 'JPEG', quality=85)
    print(f"✅ Created: {output_path}")

print(f"\n✅ Generated {len(thumbnails)} thumbnails in {thumbnails_dir}/")








