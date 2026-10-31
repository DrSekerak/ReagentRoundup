"""Generate static data/SVGs from manually checked transcriptions, never infer chemistry.

Run from repo root: python tools/prepare_questions.py
Install preparation-only dependencies from tools/requirements.txt first.
"""
import hashlib
import html
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path('tmp/pythondeps').resolve()))
from rdkit import Chem, rdBase
from rdkit.Chem import rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'Organic_Reaction_Reagents_60_Problems.pdf'
evidence = json.loads((ROOT/'tools/source-evidence.json').read_text(encoding='utf-8'))
structures = json.loads((ROOT/'tools/structure-transcriptions.json').read_text(encoding='utf-8'))
assert len(evidence) == len(structures) == 60

def normalize(text):
    replacements = {
        'Cl , hν\n2':'Cl₂, hν', 'Br , hν\n2':'Br₂, hν', 'Br , Δ\n2':'Br₂, Δ',
        'ZnCl\n2':'ZnCl₂', 'H O, Δ\n2':'H₂O, Δ', 'CH OH, Δ\n3':'CH₃OH, Δ',
        'H SO , Δ\n2 4':'H₂SO₄, Δ', 'H PO , Δ\n3 4':'H₃PO₄, Δ',
        'NaOCH\n3':'NaOCH₃', 'NH\n3':'NH₃',
    }
    for old,new in replacements.items():
        text=text.replace(old,new)
    return text.strip()

def category(n):
    for limit,cat in [(5,'radical-chlorination'),(10,'radical-bromination-br2'),(14,'radical-bromination-nbs'),(19,'sn1'),(23,'e1'),(28,'sn2'),(33,'e2-zaitsev'),(37,'e2-hofmann'),(41,'alcohol-dehydration'),(45,'alcohol-hbr'),(50,'alcohol-hcl-zncl2'),(60,'sn2')]:
        if n <= limit: return cat

mechanisms = {
    'radical-chlorination': ('Consider radical chlorination.', 'This is radical chlorination. Light initiates the radical chain that replaces a carbon-bound hydrogen with chlorine.'),
    'radical-bromination-br2': ('Consider radical bromination.', 'This is radical bromination. Light or heat initiates a radical chain; the indicated site forms a relatively stable carbon radical.'),
    'radical-bromination-nbs': ('Consider allylic radical bromination.', 'This is allylic radical bromination. NBS under the stated radical conditions replaces an allylic hydrogen while retaining an alkene.'),
    'sn1': ('Consider SN1 solvolysis.', 'This is SN1 solvolysis. Ionization of the tertiary halide allows the water or alcohol solvent to form the indicated carbon–oxygen bond; elimination can compete.'),
    'e1': ('Consider E1 elimination.', 'This is E1 elimination. Ionization of the tertiary halide followed by loss of a beta hydrogen gives the indicated alkene under heated solvolysis conditions.'),
    'sn2': ('Consider SN2 substitution.', 'This is SN2 substitution. Backside attack displaces the halide in one step, with inversion when the reacting carbon is stereogenic.'),
    'e2-zaitsev': ('Consider E2 elimination favoring the Zaitsev product.', 'This is E2 elimination. The hydroxide or alkoxide base removes a beta hydrogen as the halide leaves, favoring the more substituted alkene.'),
    'e2-hofmann': ('Consider E2 elimination favoring the Hofmann product.', 'This is E2 elimination favoring the Hofmann product. The bulky tert-butoxide base favors removal of a less hindered beta hydrogen, giving the terminal alkene.'),
    'alcohol-dehydration': ('Consider acid-catalyzed dehydration of an alcohol.', 'This is acid-catalyzed alcohol dehydration. Concentrated acid and heat promote loss of water and formation of the indicated alkene.'),
    'alcohol-hbr': ('Consider substitution of an alcohol hydroxyl group by bromide.', 'This converts an alcohol to an alkyl bromide. HBr activates the hydroxyl group for departure as water and supplies bromide for substitution.'),
    'alcohol-hcl-zncl2': ('Consider substitution of an alcohol hydroxyl group by chloride.', 'This converts an alcohol to an alkyl chloride. HCl/ZnCl₂ activates the hydroxyl group and supplies chloride for substitution.'),
}

issues = {
    35: ['Confirm that DIPEA with the secondary chloride gives the intended terminal alkene under the intended conditions; no solvent or temperature is supplied. Preserve the instructor answer pending review.'],
    36: ['Confirm diisopropylamine (the neutral amine, not an amide anion) and the required conditions for elimination of the secondary iodide to hex-1-ene. Do not silently replace this reagent.'],
    37: ['Confirm 2,6-lutidine and the intended conditions for elimination of the revised primary bromide. The visible revised substrate has only one beta-carbon position, so a Hofmann-versus-Zaitsev choice is not illustrated.'],
}
advisories = {
    2: ['Chlorination can give regioisomeric products; the source specifies the displayed transformation, not an exclusive product.'],
    3: ['Chlorination can give regioisomeric products; do not describe the tertiary chloride as the sole product.'],
    11: ['Allylic radical resonance can give other regioisomers; the depicted product is the instructor-selected transformation.'],
    12: ['Allylic radical resonance can give other regioisomers; retain the source product.'],
    15: ['Heated solvolysis can compete with E1; instructor-selected substitution answer retained.'],
    16: ['Heated solvolysis can compete with E1; instructor-selected substitution answer retained.'],
    17: ['Heated solvolysis can compete with E1; instructor-selected substitution answer retained.'],
    18: ['Heated solvolysis can compete with E1; instructor-selected substitution answer retained.'],
    19: ['Heated solvolysis can compete with E1; instructor-selected substitution answer retained.'],
    29: ['Source draws E-but-2-ene without an E + Z label; preserve that drawing without claiming exclusive E selectivity.'],
    30: ['Source explicitly says E + Z; SVG shows a representative E structure with E + Z annotation.'],
    32: ['Source explicitly says E + Z; SVG shows a representative E structure with E + Z annotation.'],
    33: ['Source draws Z-3-methylpent-2-ene without an E + Z label. Confirm whether one stereoisomer or a mixture is intended; the drawn Z structure is retained.'],
    40: ['Source explicitly says E + Z; SVG shows a representative E structure with E + Z annotation.'],
    45: ['Source shows direct replacement in cyclohexylmethanol; retain this intended structure without asserting absence of rearrangement under all conditions.'],
    53: ['Phosphonium positive charge retained; bromide counterion is omitted in the source structure and remains omitted.'],
    54: ['Ammonium positive charge retained; bromide counterion is omitted in the source structure and remains omitted.'],
}

output = ROOT/'public/structures'
output.mkdir(parents=True,exist_ok=True)
questions=[]
manifest=[]
for row, structure in zip(evidence,structures):
    n=row['number']; qid=f'pdf-{n:02d}'; cat=category(n)
    parts=re.split(r'(?m)^([1-7])\. ', row['distractors'])
    assert parts[0] == '' and len(parts)==15, n
    choices=[normalize(parts[k+1]) for k in range(1,15,2)]
    assert [parts[k] for k in range(1,15,2)]==list('1234567')
    answer=normalize(row['correct'])
    assert len(set([answer,*choices]))==8, n
    hint, mechanism=mechanisms[cat]
    specific=f'The displayed transformation converts {structure[2].split(",")[0].lower()} to {structure[3].split(",")[0].lower()}.'
    if n in issues:
        explanation=f'The instructor labels this an E2 Hofmann elimination from {structure[2].split(",")[0].lower()} to {structure[3].lower()}. The stated base and conditions require instructor review before this question can be used for practice.'
    elif n==5:
        explanation='This is radical chlorination of 2,2-dimethylpropane. All twelve hydrogens are equivalent, so replacing one with chlorine gives the displayed 1-chloro-2,2-dimethylpropane.'
    else:
        explanation=f'{mechanism} {specific}'
    q=dict(id=qid,category=cat,correctAnswer=answer,distractors=choices,explanation=explanation,hint=hint,
           source=dict(problemNumber=n,page=row['page'],document=SOURCE),
           review=dict(status='needs-review' if n in issues else 'prepared', issues=issues.get(n,[]), notes=advisories.get(n,[])))
    for role,smiles,name in [('reactant',structure[0],structure[2]),('product',structure[1],structure[3])]:
        mol=Chem.MolFromSmiles(smiles)
        assert mol is not None,(n,role,smiles)
        if n in [59,60]:
            cip=Chem.FindMolChiralCenters(mol,includeUnassigned=True)
            assert cip[0][1] == ('S' if role=='reactant' else 'R'),(n,role,cip)
        drawer=rdMolDraw2D.MolDraw2DSVG(640,300)
        drawer.drawOptions().addStereoAnnotation = True
        drawer.drawOptions().padding = 0.16
        legend='E + Z (representative structure)' if role=='product' and n in [30,32,40] else ''
        rdMolDraw2D.PrepareAndDrawMolecule(drawer,mol,legend=legend)
        drawer.FinishDrawing()
        svg=drawer.GetDrawingText().replace('<svg ', '<svg role="img" ')
        svg=svg.replace('<!-- END OF HEADER -->', '<title>'+html.escape(name)+'</title>\n<!-- END OF HEADER -->')
        path=output/f'{qid}-{role}.svg'
        path.write_text(svg,encoding='utf-8')
        q[role]=dict(smiles=smiles,svgPath=f'structures/{path.name}',alt=name)
        manifest.append(dict(questionId=qid,role=role,smiles=smiles,formula=rdMolDescriptors.CalcMolFormula(mol),
                             chiralCenters=Chem.FindMolChiralCenters(mol,includeUnassigned=True),
                             doubleBondStereo=[str(b.GetStereo()) for b in mol.GetBonds() if b.GetBondType()==Chem.BondType.DOUBLE],
                             svgSha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    if n in [30,32,40]: q['stereochemistry']='E + Z as explicitly labeled in the PDF; representative E structure shown.'
    elif n in [59,60]: q['stereochemistry']='SN2 inversion: source reacting center S → R; wedges/dashes preserved in regenerated depiction.'
    elif n==29: q['stereochemistry']='E alkene as drawn; source does not explicitly state a mixture.'
    elif n==33: q['stereochemistry']='Z alkene as drawn; source does not explicitly state a mixture.'
    questions.append(q)
(ROOT/'src/data/question-bank.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'tools/structure-manifest.json').write_text(json.dumps(dict(rdkitVersion=rdBase.rdkitVersion,structures=manifest),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(questions)} records and {len(manifest)} SVGs; {len(issues)} records held for instructor review.')
