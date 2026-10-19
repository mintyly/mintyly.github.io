"""Tighten Zpix's full-width curly quotes for English text.

Run with FontTools installed. Safe to rerun: outlines are normalized to x=0
and retain the same 200-unit trailing spacing as ASCII punctuation.
"""
from pathlib import Path
from fontTools.ttLib import TTFont

path = Path(__file__).resolve().parents[1] / 'public/fonts/zpix.ttf'
font = TTFont(path)
cmap = font.getBestCmap()
for codepoint in (0x2018, 0x2019, 0x201C, 0x201D):
    name = cmap[codepoint]
    glyph = font['glyf'][name]
    offset = glyph.xMin
    glyph.coordinates.translate((-offset, 0))
    glyph.recalcBounds(font['glyf'])
    font['hmtx'][name] = (glyph.xMax + 200, 0)
font.save(path)
