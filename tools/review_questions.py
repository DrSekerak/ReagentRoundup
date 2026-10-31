"""Create local instructor review evidence and render every generated SVG for QA."""
import hashlib
import base64
import html
import json
from pathlib import Path
import shutil
import sys
sys.path.insert(0,str(Path('tmp/pythondeps').resolve()))
import pymupdf
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
bank=json.loads((root/'src/data/question-bank.json').read_text(encoding='utf-8'))
out=root/'docs'
out.mkdir(exist_ok=True)
source_images=out/'source-structures'
source_images.mkdir(exist_ok=True)
cards=[]
for q in bank:
    n=q['source']['problemNumber']
    images=[]
    for role in ['reactant','product']:
        name=f'q{n:02d}-{role}.png'
        shutil.copyfile(root/'tmp/pdfs'/name,source_images/name)
        svg=root/'public'/q[role]['svgPath']
        doc=pymupdf.open(svg)
        pix=doc[0].get_pixmap()
        pix.save(str(root/'tmp/pdfs'/f'{q["id"]}-{role}-rendered.png'))
        # Inline PNG previews work when this HTML is opened or moved on its own.
        # The application still uses the original vector SVG assets.
        source_uri='data:image/png;base64,'+base64.b64encode((source_images/name).read_bytes()).decode('ascii')
        prepared_uri='data:image/png;base64,'+base64.b64encode(pix.tobytes('png')).decode('ascii')
        images.append(f'<figure><figcaption>Source {role}</figcaption><img src="{source_uri}" alt="Source {role} for question {n}"></figure><figure><figcaption>Prepared {role}</figcaption><img src="{prepared_uri}" alt="{html.escape(q[role]["alt"],quote=True)}"></figure>')
    notes=''.join('<li>'+html.escape(t)+'</li>' for t in q['review']['issues']+q['review']['notes'])
    answers=''.join('<li>'+html.escape(t)+'</li>' for t in q['distractors'])
    cards.append(f'<section><h2>{q["id"]} · PDF page {q["source"]["page"]} · {q["category"]}</h2><p><strong>{q["review"]["status"]}</strong></p><div class="structures">{"".join(images)}</div><p>Correct answer: <strong>{html.escape(q["correctAnswer"])}</strong></p><details><summary>Seven distractors</summary><ol>{answers}</ol></details><p>{html.escape(q["explanation"])}</p><p>Hint: {html.escape(q["hint"])}</p><ul>{notes}</ul></section>')
page='<!doctype html><html lang="en"><meta charset="utf-8"><title>Stage 2 instructor review</title><style>body{font:16px/1.5 system-ui;max-width:1400px;margin:30px auto;padding:20px;background:#f6f4f8;color:#393144}section{background:white;padding:24px;margin:24px 0;border:1px solid #ddd;border-radius:10px}.structures{display:grid;grid-template-columns:repeat(4,1fr)}figure{margin:8px}img{width:100%;height:180px;object-fit:contain}figcaption{font-size:13px;color:#685d73}summary{cursor:pointer}@media(max-width:700px){.structures{grid-template-columns:1fr 1fr}}</style><h1>Stage 2 instructor review</h1><p>60 source records. Questions 35–37 are held pending instructor review. Prepared means transcribed and checked, not instructor-approved. Source thumbnails reflect the final visible PDF, including revisions. This local review file is outside the deployed app.</p>'+''.join(cards)+'</html>'
(out/'instructor-review.html').write_text(page,encoding='utf-8')
(out/'instructor-review-standalone.html').write_text(page,encoding='utf-8')
report=['# Stage 2 instructor review','', '60 questions transcribed; 120 RDKit SVGs generated. **57 prepared, 3 held.** Prepared does not mean instructor-approved. The original answer key and seven distractors are retained for every record; only chemical typography is normalized.','', '## Held questions (excluded from available practice count)','']
for q in bank:
    if q['review']['issues']:
        report.append(f'- **{q["id"]}, PDF page {q["source"]["page"]}:** '+ ' '.join(q['review']['issues']))
report+=['','## Additional instructor notes','']
for q in bank:
    if q['review']['notes']:
        report.append(f'- **{q["id"]}, PDF page {q["source"]["page"]}:** '+' '.join(q['review']['notes']))
report+=['','## Checks and provenance','', '- All 60 starting materials/products were visually inspected from final visible PDF crops and transcribed to SMILES. Page 13 includes a revised image over an older image; question 37 uses the visible primary bromide.', '- Questions 30, 32, 40 retain the explicit E + Z label. Questions 29 and 33 retain the E and Z structures respectively as drawn, without asserting exclusive selectivity.', '- Questions 59–60 retain S → R inversion. RDKit checks both stereocenters and generates hashed reactant bonds and solid product wedges. The absolute labels follow the source geometry; inversion is not inferred solely from a change in SMILES @ notation.', '- Formal charges on phosphonium/ammonium/azide products, alkynes and nitrile triple bonds are preserved. No counterions are added where omitted by the source.', '- Rendered SVGs are inspected alongside source crops. Reorientation by RDKit is expected; molecular connectivity, charges and configuration govern equivalence.', '- Review decisions above are preparation judgments, not alterations to the instructor key. Validate intended conditions for the held items rather than replacing their answers automatically.', '', 'Background references supporting review criteria: [OpenStax E2](https://openstax.org/books/organic-chemistry/pages/11-8-the-e2-reaction-and-the-deuterium-isotope-effect), [OpenStax SN2](https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction). These references inform flags; the supplied PDF remains the authoritative question source.', '', '## Instructor workflow','', 'Open `instructor-review.html` in a browser to compare each source structure with its SVG and inspect the answer set. Resolve held issues in `tools/prepare_questions.py` with instructor-approved changes, update the transcriptions if necessary, regenerate data and SVGs, run all checks, and record the decision here. Do not change only the generated JSON or the next regeneration will overwrite the correction. Additional notes do not automatically exclude an otherwise faithful source question.','']
source=Path(sys.argv[1]) if len(sys.argv)>1 else None
if source:
    report+=['Source PDF SHA-256: `'+hashlib.sha256(source.read_bytes()).hexdigest()+'`.','']
(out/'instructor-review.md').write_text('\n'.join(report),encoding='utf-8')
for start in range(0,60,10):
    sheet=Image.new('RGB',(1720,1750),'white'); draw=ImageDraw.Draw(sheet)
    for row,n in enumerate(range(start+1,start+11)):
        draw.text((5,row*175),f'{n} source / prepared',fill='black')
        for i,role in enumerate(['reactant','product']):
            for offset,path in [(0,root/'tmp/pdfs'/f'q{n:02d}-{role}.png'),(840,root/'tmp/pdfs'/f'pdf-{n:02d}-{role}-rendered.png')]:
                im=Image.open(path).convert('RGB'); im.thumbnail((400,145))
                sheet.paste(im,(25+i*410+offset,row*175+25))
    sheet.save(root/'tmp/pdfs'/f'comparison-{start+1:02d}-{start+10:02d}.png')
print('Created review HTML, report, source evidence and six comparison sheets.')
