"""Create a pixel-grid-aligned Zpix coding font. Requires FontTools."""
from pathlib import Path
import unicodedata
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'public/fonts/zpix.ttf')
widths = {}
for cp, name in font.getBestCmap().items():
    category = unicodedata.category(chr(cp))
    width = 0 if category in ('Mn', 'Me', 'Cf') else (
        1400 if unicodedata.east_asian_width(chr(cp)) in ('W', 'F') else 700
    )
    widths[name] = max(widths.get(name, 0), width)

for name in font.getGlyphOrder():
    glyph = font['glyf'][name]
    width = widths.get(name, 700)
    if glyph.numberOfContours:
        # Keep outlines on Zpix's 100-unit pixel grid rather than introducing
        # half-pixel strokes while centering punctuation and narrow letters.
        left = round((width - (glyph.xMax - glyph.xMin)) / 200) * 100
        shift = left - glyph.xMin
        if glyph.isComposite():
            for component in glyph.components:
                component.x += shift
        else:
            glyph.coordinates.translate((shift, 0))
        glyph.recalcBounds(font['glyf'])
        font['hmtx'][name] = (width, glyph.xMin)
    else:
        font['hmtx'][name] = (width, 0)

names = {1: 'Zpix Monospace Fixed', 2: 'Regular',
         3: 'ZpixMonospaceFixed-Regular-1', 4: 'Zpix Monospace Fixed',
         6: 'ZpixMonospaceFixed-Regular', 16: 'Zpix Monospace Fixed', 17: 'Regular'}
font['name'].names = [n for n in font['name'].names if n.nameID not in names]
for name_id, value in names.items():
    font['name'].setName(value, name_id, 3, 1, 0x409)
font['post'].isFixedPitch = 1
font.save(root / 'public/fonts/zpix_monospace_fixed.ttf')
print('Created zpix_monospace_fixed.ttf (700-unit Latin cells, 1400-unit CJK cells)')
