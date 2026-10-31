"""Apply explicit instructor decisions without changing source structures/answers."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVALS = json.loads((ROOT/'tools/instructor-approvals.json').read_text(encoding='utf-8'))
EXPLANATIONS = {
    'pdf-35': 'This instructor-approved E2 Hofmann example converts 2-chloropentane to pent-1-ene using DIPEA. Loss of a beta hydrogen and chloride forms the displayed terminal double bond.',
    'pdf-36': 'This instructor-approved E2 Hofmann example converts 2-iodohexane to hex-1-ene using diisopropylamine. Loss of a beta hydrogen and iodide forms the displayed terminal double bond.',
    'pdf-37': 'This instructor-approved elimination converts 1-bromo-3-methylbutane to 3-methylbut-1-ene using 2,6-lutidine. Loss of a beta hydrogen and bromide forms the displayed terminal double bond; the instructor retains the source Hofmann category.',
}

def apply_approval(question):
    if question['id'] not in APPROVALS:
        return question
    review = question['review']
    prior = review.get('approval', {}).get('previousIssues', review['issues'])
    review['approval'] = {**APPROVALS[question['id']], 'previousIssues': prior}
    review['status'] = 'prepared'
    review['issues'] = []
    note = 'Instructor approved this question as supplied on '+review['approval']['date']+'. Original answer, distractors, structures, and category retained.'
    if note not in review['notes']:
        review['notes'].append(note)
    question['explanation'] = EXPLANATIONS[question['id']]
    return question

if __name__ == '__main__':
    path = ROOT/'src/data/question-bank.json'
    bank = json.loads(path.read_text(encoding='utf-8'))
    for question in bank:
        apply_approval(question)
    path.write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('Recorded instructor approval for questions 35–37.')
