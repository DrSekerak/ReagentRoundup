"""Read-only extraction of source evidence; run with the bundled Python runtime."""
import io
import json
import logging
from pathlib import Path
import sys
sys.path.insert(0, str(Path('tmp/pythondeps').resolve()))
import pymupdf as fitz

import pdfplumber
from PIL import Image, ImageDraw
from pypdf import PdfReader

logging.getLogger('pypdf').setLevel(logging.ERROR)
source = Path(sys.argv[1])
out = Path('tmp/pdfs')
out.mkdir(parents=True, exist_ok=True)
reader = PdfReader(source)
render_doc = fitz.open(source)
evidence = []
with pdfplumber.open(source) as pdf:
    for page_index, page in enumerate(pdf.pages):
        words = page.extract_words()
        headers = [w for w in words if w['x0'] < 48 and w['text'].isdigit() and 1 <= int(w['text']) <= 60 and w['top'] > 65]
        headers.sort(key=lambda w: w['top'])
        images = sorted(page.images, key=lambda im: (round(im['top']), im['x0']))
        for row, head in enumerate(headers):
            number = int(head['text'])
            top = head['top'] - 3
            bottom = headers[row+1]['top']-4 if row+1 < len(headers) else 570
            correct = page.crop((325, top, 475, bottom)).extract_text() or ''
            distractors = page.crop((480, top, 767, bottom)).extract_text() or ''
            entry = dict(number=number, page=page_index+1, correct=correct, distractors=distractors,
                         problem=page.crop((32,top,320,bottom)).extract_text() or '')
            row_images = [im for im in images if top < im['top'] < bottom and im['x0'] < 320]
            bounds = [('reactant',32,146),('product',183,314)] if number >= 51 else [('reactant',42,156),('product',195,310)]
            for role, left, right in bounds:
                relevant = [im for im in row_images if left-1 <= im['x0'] <= right]
                assert relevant, (number,role)
                y0 = min(im['top'] for im in relevant)-2
                y1 = max(im['bottom'] for im in relevant)+2
                pix = render_doc[page_index].get_pixmap(matrix=fitz.Matrix(3.5,3.5), clip=fitz.Rect(left,y0,right,y1))
                pix.save(str(out/f'q{number:02d}-{role}.png'))
            evidence.append(entry)
for start in range(0,60,10):
    sheet = Image.new('RGB',(900,1750),'white')
    draw = ImageDraw.Draw(sheet)
    for row, number in enumerate(range(start+1,start+11)):
        draw.text((5,row*175+5),str(number),fill='black')
        for col,role in enumerate(['reactant','product']):
            im=Image.open(out/f'q{number:02d}-{role}.png').convert('RGB')
            sheet.paste(im,(40+col*430,row*175+15))
    sheet.save(out/f'structures-{start+1:02d}-{start+10:02d}.png')
(out/'extracted.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Extracted {len(evidence)} question rows')
