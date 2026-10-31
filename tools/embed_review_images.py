"""Repair an existing review from already-rendered PNGs without PDF dependencies."""
import base64
import io
from pathlib import Path
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
review = root / 'docs/instructor-review.html'
page = review.read_text(encoding='utf-8')

def embed(match):
    src = match.group(1)
    if src.startswith('data:image/png;base64,'):
        data = base64.b64decode(src.split(',', 1)[1], validate=True)
    else:
        if src.startswith('../public/structures/'):
            name = Path(src).stem + '-rendered.png'
            path = root / 'tmp/pdfs' / name
        else:
            path = review.parent / src
        data = path.read_bytes()
    with Image.open(io.BytesIO(data)) as image:
        image.verify()
    return 'src="data:image/png;base64,' + base64.b64encode(data).decode('ascii') + '"'

page, count = re.subn(r'src="([^"]+)"', embed, page)
assert count == 240, f'Expected 4 images for each of 60 questions; found {count}'
assert page.count('<section>') == 60
assert not re.search(r'src="(?!data:image/png;base64,)', page)
review.write_text(page, encoding='utf-8')
(review.parent / 'instructor-review-standalone.html').write_text(page, encoding='utf-8')
print(f'Embedded and decoded all {count} PNG images across 60 questions ({review.stat().st_size:,} bytes).')
