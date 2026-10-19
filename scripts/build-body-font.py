"""Build PixelMplus letter/number outlines on the corrected Zpix font.

Usage: python scripts/build-body-font.py REGULAR.ttf BOLD.ttf
Requires FontTools. Zpix punctuation, symbols, spacing and vertical metrics
are preserved; other characters fall back to the original Zpix glyphs.
"""
import sys
import math
import unicodedata
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parents[1]
for source, weight in zip(sys.argv[1:], ('Regular', 'Bold')):
    font = TTFont(root / 'public/fonts/zpix.ttf')
    pixel = TTFont(source)
    base_cmap, pixel_cmap = font.getBestCmap(), pixel.getBestCmap()
    glyphs = pixel.getGlyphSet()
    scale = font['head'].unitsPerEm / pixel['head'].unitsPerEm
    # Align the Latin capital baseline with Zpix. PixelMplus starts 60
    # units higher after scaling even though the font metrics are identical.
    base_cap = font['glyf'][base_cmap[ord('H')]]
    pixel_cap = pixel['glyf'][pixel_cmap[ord('H')]]
    baseline_shift = math.floor(base_cap.yMin - pixel_cap.yMin * scale)
    order = list(font.getGlyphOrder())
    count = 0
    for cp in sorted(base_cmap.keys() & pixel_cmap.keys()):
        if unicodedata.category(chr(cp))[0] not in 'LN':
            continue
        name = f'pixel{cp:06X}'
        recording = DecomposingRecordingPen(glyphs)
        glyphs[pixel_cmap[cp]].draw(recording)
        pen = TTGlyphPen(None)
        recording.replay(TransformPen(pen, (scale, 0, 0, scale, 0, baseline_shift)))
        glyph = pen.glyph()
        glyph.recalcBounds(font['glyf'])
        # Matching font baselines alone does not match x-height: PixelMplus
        # lowercase letters are one pixel shorter than Zpix. Match Latin
        # ink heights above/below the baseline independently, keeping the
        # baseline anchored and leaving punctuation and CJK untouched.
        original = font['glyf'][base_cmap[cp]]
        is_latin = 'LATIN' in unicodedata.name(chr(cp), '') or 0x30 <= cp <= 0x39
        if is_latin and glyph.numberOfContours > 0 and original.numberOfContours > 0:
            baseline = base_cap.yMin
            top, bottom = glyph.yMax, glyph.yMin
            target_top, target_bottom = original.yMax, original.yMin
            for i, (x, y) in enumerate(glyph.coordinates):
                if y > baseline and top > baseline:
                    y = baseline + (y - baseline) * (target_top - baseline) / (top - baseline)
                elif y < baseline and bottom < baseline:
                    y = baseline + (y - baseline) * (target_bottom - baseline) / (bottom - baseline)
                glyph.coordinates[i] = (round(x), round(y))
            glyph.recalcBounds(font['glyf'])
        font['glyf'].glyphs[name] = glyph
        advance = font['hmtx'][base_cmap[cp]][0]
        font['hmtx'][name] = (advance, getattr(glyph, 'xMin', 0))
        order.append(name)
        for table in font['cmap'].tables:
            if table.isUnicode() and cp in table.cmap:
                table.cmap[cp] = name
        count += 1
    font.setGlyphOrder(order)
    for name_id, value in {
        1: 'PixelMplus Special', 2: weight,
        3: f'PixelMplusSpecial-{weight}-1',
        4: f'PixelMplus Special {weight}',
        6: f'PixelMplusSpecial-{weight}',
    }.items():
        font['name'].setName(value, name_id, 3, 1, 0x409)
    # Retain both source fonts' attribution and license metadata.
    for record in pixel['name'].names:
        if record.nameID in (0, 13, 14):
            text = record.toUnicode()
            previous = font['name'].getDebugName(record.nameID) or ''
            if text not in previous:
                font['name'].setName((previous + '\n' + text).strip(), record.nameID, 3, 1, 0x409)
    font['OS/2'].usWeightClass = 700 if weight == 'Bold' else 400
    font['OS/2'].fsSelection &= ~((1 << 5) | (1 << 6))
    font['OS/2'].fsSelection |= 1 << (5 if weight == 'Bold' else 6)
    font['head'].macStyle = 1 if weight == 'Bold' else 0
    destination = root / f'public/fonts/PixelMplus-special-{weight}.ttf'
    font.save(destination)
    print(f'{destination.name}: {count} letter/number glyphs replaced')
