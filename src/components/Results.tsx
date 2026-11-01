import { useEffect, useRef, useState } from 'react';
import { reactionCategories } from '../data/categories';
import { sessionFinished, type PracticeSession } from '../lib/practice';
import { summarizeSession } from '../lib/scoring';

export default function Results({ session, onReturn }: { session: PracticeSession; onReturn: () => void }) {
  const [review, setReview] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  if (!sessionFinished(session)) return null;
  const summary = summarizeSession(session);
  return <section className="results-panel" aria-labelledby="results-heading">
    <p className="eyebrow">SESSION RESULTS</p><h1 ref={heading} tabIndex={-1} id="results-heading">Practice complete</h1>
    <div className="results-highlights"><p><strong>{summary.percentage.toFixed(1)}%</strong> answered correctly within three attempts</p><p><strong>{summary.points} / {summary.maximumPoints}</strong> points earned</p></div>
    <dl className="results-stats"><div><dt>Questions completed</dt><dd>{summary.completed}</dd></div><div><dt>Correct on first attempt</dt><dd>{summary.first}</dd></div><div><dt>Correct on second attempt</dt><dd>{summary.second}</dd></div><div><dt>Correct on third attempt</dt><dd>{summary.third}</dd></div><div><dt>Not correct after three attempts</dt><dd>{summary.unsuccessful}</dd></div><div><dt>Questions with hints used</dt><dd>{summary.hints}</dd></div></dl>
    <p>Scoring: 3 points on the first attempt, 2 on the second, 1 on the third. Hints do not reduce your score.</p>
    <h2>Results by reaction category</h2><div className="table-scroll"><table><caption className="sr-only">Reaction category performance</caption><thead><tr><th scope="col">Reaction category</th><th scope="col">Attempted</th><th scope="col">Correct</th><th scope="col">Correct (%)</th></tr></thead><tbody>{summary.categories.map(c => <tr key={c.id}><th scope="row">{c.label}</th><td>{c.attempted}</td><td>{c.correct}</td><td>{c.percentage === null ? '—' : `${c.percentage.toFixed(1)}%`}</td></tr>)}</tbody></table></div>
    <div className="results-actions"><button className="primary-button" onClick={onReturn}>Start Another Practice Session</button><button className="secondary-button" onClick={onReturn}>Return to Introduction</button><button className="secondary-button" aria-expanded={review} aria-controls="detailed-review" onClick={() => setReview(value => !value)}>{review ? 'Hide Detailed Review' : 'Review Results'}</button></div>
    {review && <div id="detailed-review"><h2>Detailed question review</h2><div className="table-scroll"><table><caption className="sr-only">Submitted answers and final results</caption><thead><tr><th scope="col">Question</th><th scope="col">Reaction category</th><th scope="col">Correct answer</th><th scope="col">Submitted answers</th><th scope="col">Attempts used</th><th scope="col">Hint used</th><th scope="col">Final result</th></tr></thead><tbody>{session.entries.map((entry, index) => <tr key={entry.question.id}><th scope="row">{index + 1}</th><td>{reactionCategories.find(c => c.id === entry.question.category)?.label}</td><td>{entry.question.correctAnswer}</td><td><ol>{entry.attempts.map(answer => <li key={answer}>{answer}</li>)}</ol></td><td>{entry.attempts.length}</td><td>{entry.hintUsed ? 'Yes' : 'No'}</td><td>{entry.correct ? `Correct on attempt ${entry.attempts.length}` : 'Not correct after three attempts'}</td></tr>)}</tbody></table></div></div>}
  </section>;
}
