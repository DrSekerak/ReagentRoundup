"""Generate Unit 4 questions and exact source-drawing SVGs.

Usage: python tools/prepare_unit4.py /path/to/Organic_Reactions_80_Problems_Revised_v11.pdf
Requires PyMuPDF (preparation only). No source PDF is written or modified.
Checked answers/accessible descriptions live in unit4-source-evidence.json.
"""
import hashlib
import html
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tmp/pythondeps'))
import pymupdf as fitz

evidence = json.loads((ROOT / 'tools/unit4-source-evidence.json').read_text(encoding='utf-8'))
source = Path(sys.argv[1])
assert hashlib.sha256(source.read_bytes()).hexdigest() == evidence['sha256'], 'Source revision differs from checked evidence'
doc = fitz.open(source)
assert len(doc) == 40

MECHANISMS = {
    'alkoxide-formation': ('Consider removing the alcohol proton.', 'The stated hydride or alkali metal converts the alcohol to its alkoxide. Hydrogen gas is released; the carbon skeleton is retained.'),
    'alkene-hx': ('Consider Markovnikov addition of HX.', 'HX adds across the alkene. The halide is bonded to the more substituted carbon in the displayed product; carbocation rearrangement can occur.'),
    'alkene-hbr-peroxide': ('Consider radical addition of HBr with a peroxide.', 'HBr with ROOR adds by a radical chain, placing bromine at the less substituted alkene carbon to give the anti-Markovnikov product.'),
    'alkene-acid-hydration': ('Consider acid-catalyzed hydration.', 'Aqueous acid adds water across the alkene through a carbocation intermediate. Markovnikov hydration and possible carbocation rearrangement account for the displayed alcohol.'),
    'oxymercuration': ('Consider hydration without carbocation rearrangement.', 'Oxymercuration in water followed by NaBH₄ gives the Markovnikov alcohol without a free carbocation rearrangement. The source drawing specifies the depicted product stereochemistry.'),
    'alkoxymercuration': ('Consider Markovnikov addition of an alcohol.', 'Alkoxymercuration in the stated alcohol followed by NaBH₄ gives the Markovnikov ether without carbocation rearrangement.'),
    'hydroboration-oxidation': ('Consider anti-Markovnikov hydration with syn addition.', 'Hydroboration followed by peroxide oxidation places OH at the less substituted alkene carbon. H and OH add syn; the source preserves any depicted stereoisomers.'),
    'alkene-halogenation': ('Consider addition of X₂ across the double bond.', 'The dihalogen adds across the alkene through a halonium intermediate to form a vicinal dihalide. Addition is anti where stereochemistry is specified.'),
    'halohydrin-formation': ('Consider halogen addition in water.', 'The halogen forms a halonium intermediate, which water opens. OH is placed at the more substituted carbon when the alkene is unsymmetrical, with anti addition.'),
    'syn-dihydroxylation': ('Consider adding two OH groups to the same face.', 'OsO₄ with peroxide or cold, dilute alkaline KMnO₄ gives a vicinal diol by syn addition. These mild conditions retain the carbon-carbon skeleton.'),
    'peracid-epoxidation': ('Consider oxygen transfer from a peracid.', 'mCPBA transfers oxygen to the alkene in a concerted epoxidation. The relative arrangement of substituents on the alkene is retained in the epoxide.'),
    'halohydrin-epoxide': ('Consider an alkoxide closing onto an adjacent carbon bearing a halide.', 'NaH deprotonates the halohydrin OH. The resulting alkoxide closes by intramolecular SN2 displacement to form an epoxide, with inversion at the carbon bearing the leaving group.'),
    'epoxide-acid-opening': ('Consider acid-catalyzed opening of an epoxide by water.', 'Aqueous acid protonates the epoxide, allowing water to open the ring. Backside attack gives anti opening and the displayed vicinal diol.'),
    'epoxidation-hydrolysis': ('Consider epoxidation followed by aqueous acid.', 'mCPBA first forms an epoxide. Aqueous acid then opens it by backside attack, giving overall anti dihydroxylation of the alkene.'),
    'alkene-hydrogenation': ('Consider catalytic addition of hydrogen to an alkene.', 'The stated metal catalyst adds H₂ across the alkene to form an alkane. Addition occurs syn at the catalyst surface.'),
    'simmons-smith': ('Consider the Simmons-Smith reagent.', 'CH₂I₂ with Zn(Cu) transfers a methylene group across the alkene to form a cyclopropane. The relative geometry of alkene substituents is retained.'),
    'carbene-alpha-elimination': ('Consider generating a dihalocarbene from a haloform.', 'Base promotes alpha elimination from the haloform to generate a dihalocarbene. Addition across the alkene forms a cyclopropane bearing two halogens on the new carbon and retains the relative alkene geometry.'),
    'carbene-diazomethane': ('Consider carbene generation by loss of nitrogen.', 'Heat or light releases N₂ from diazomethane, generating a carbene that adds across the alkene to give the displayed cyclopropane.'),
    'alkene-ozonolysis': ('Consider cleaving the double bond to carbonyl groups.', 'Ozone followed by the stated reductive workup cleaves the C=C bond to aldehydes and/or ketones. An alkene carbon bearing a hydrogen gives an aldehyde.'),
    'alkene-oxidative-cleavage': ('Consider cleavage with hot, concentrated permanganate.', 'Hot, concentrated KMnO₄ cleaves the alkene. An alkene carbon bearing a hydrogen is oxidized to a carboxylic acid; one bearing no hydrogen gives a ketone.'),
    'olefin-metathesis': ('Consider exchanging alkene fragments with a metal carbene catalyst.', 'The stated Schrock or Grubbs catalyst promotes olefin metathesis, exchanging alkene fragments to form the displayed cross-metathesis product. The PDF specifies E + Z; ethylene coproduct is omitted from its product drawing.'),
}

bank=[]
manifest=[]
for row in evidence['questions']:
    n=row['number']; qid=f'unit4-{n:02d}'; category=row['category']
    hint, explanation=MECHANISMS[category]
    if n in (43,44): explanation='Br₂ in water first forms a halohydrin. ' + explanation
    if n == 56: explanation='D₂ with Pd/C adds two deuterium atoms syn across the double bond. The source shows the cis deuterium-labeled cyclohexane.'
    q=dict(id=qid, category=category, correctAnswer=row['correct'], distractors=row['distractors'],
           explanation=explanation, hint=hint,
           source=dict(document=evidence['document'], problemNumber=n, page=row['page']),
           review=dict(status='prepared', issues=[], notes=row.get('notes',[])))
    page=doc[row['page']-1]
    original=page.cropbox
    for role,top in [('reactant',88),('product',190)]:
        y=top+268*((n-1)%2)
        region=[40,y,330,y+80]
        page.set_cropbox(fitz.Rect(region))
        baseline_svg=page.get_svg_image(text_as_path=True)
        page.set_cropbox(original)
        # Remove content outside the drawing from a disposable in-memory copy.
        # Cropping alone leaves the rest of the page's unused paths in the SVG.
        isolated=fitz.open()
        isolated.insert_pdf(doc,from_page=row['page']-1,to_page=row['page']-1)
        drawing=isolated[0]
        for outside in [(0,0,792,y),(0,y+80,792,612),(0,y,40,y+80),(330,y,792,y+80)]:
            drawing.add_redact_annot(fitz.Rect(outside),fill=False,cross_out=False)
        drawing.apply_redactions(images=2,graphics=1,text=0)
        drawing.set_cropbox(fitz.Rect(region))
        svg=drawing.get_svg_image(text_as_path=True)
        # Require pixel-identical rendering to the unmodified source crop.
        with fitz.open(stream=baseline_svg.encode(),filetype='svg') as before, fitz.open(stream=svg.encode(),filetype='svg') as after:
            matches=before[0].get_pixmap(matrix=fitz.Matrix(2,2)).samples == after[0].get_pixmap(matrix=fitz.Matrix(2,2)).samples
        # Some overlaid source objects interact with the outside region. Keep the
        # full source crop whenever removing those paths changes even one pixel.
        if not matches: svg=baseline_svg
        isolated.close()
        title=html.escape(row[role])
        # All visible source lettering is paths; accessible descriptions are explicit.
        svg=svg.replace('<svg ', '<svg role="img" ',1)
        position=svg.index('>')+1
        svg=svg[:position]+f'<title>{title}</title>'+svg[position:]
        path=ROOT/f'public/structures/{qid}-{role}.svg'
        path.write_text(svg,encoding='utf-8',newline='\n')
        q[role]=dict(svgPath=f'structures/{path.name}',alt=row[role],
                     sourceDepiction=dict(document=evidence['document'],page=row['page'],region=region))
        manifest.append(dict(questionId=qid,role=role,region=region,isolatedCrop=matches,svgSha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    bank.append(q)
assert len(bank)==80 and len({q['id'] for q in bank})==80
(ROOT/'src/data/unit4-question-bank.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'tools/unit4-structure-manifest.json').write_text(json.dumps(dict(sourceSha256=evidence['sha256'],pymupdfVersion=fitz.VersionBind,structures=manifest),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(bank)} Unit 4 questions and {len(manifest)} exact source-drawing SVGs.')
