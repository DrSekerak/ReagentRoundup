import { useRef, useEffect, useState, useSyncExternalStore } from 'react';
import { reactionGroups, type ReactionGroup } from './data/categories';
import { questions } from './data/questions';
import { filterQuestions } from './lib/questions';
import Practice from './components/Practice';
import { createSession, transition, sessionFinished, type PracticeSession } from './lib/practice';
import { createLocalProgressRepository, type QuestionCount } from './lib/progress';

const repository = createLocalProgressRepository();

export default function App() {
  const [loaded] = useState(() => repository.load(questions));
  const [selected, setSelected] = useState<ReactionGroup[]>(loaded.progress.selectedGroups);
  const [questionCount, setQuestionCount] = useState<QuestionCount>(loaded.progress.questionCount);
  const [session, setSession] = useState<PracticeSession | null>(loaded.progress.session);
  const [practicing, setPracticing] = useState(false);
  const [needsReplacementConfirmation, setNeedsReplacementConfirmation] = useState(loaded.needsReplacementConfirmation);
  const saveNotice = useSyncExternalStore(repository.subscribe, repository.getNotice);
  const storageNotice = needsReplacementConfirmation ? loaded.notice : saveNotice;
  const selectAll = useRef<HTMLInputElement>(null);
  const allSelected = selected.length === reactionGroups.length;
  const selectedCategories = reactionGroups.filter(({ id }) => selected.includes(id)).flatMap(({ categories }) => [...categories]);
  const available = filterQuestions(questions, selectedCategories).length;

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !allSelected;
  }, [selected, allSelected, practicing]);

  useEffect(() => {
    if (needsReplacementConfirmation) return; // Keep incompatible saved work until replacement is confirmed.
    repository.save({ selectedGroups: selected, questionCount, session });
  }, [selected, questionCount, session, needsReplacementConfirmation]);

  function selectGroups(groups: ReactionGroup[]) {
    setSelected(groups);
    const categories = reactionGroups.filter(({ id }) => groups.includes(id)).flatMap(({ categories }) => [...categories]);
    const count = filterQuestions(questions, categories).length;
    if (questionCount !== 'all' && questionCount > count) setQuestionCount('all');
  }
  function toggle(id: ReactionGroup) {
    selectGroups(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  }
  function startPractice() {
    if (!confirmReplacement()) return;
    setSession(createSession(filterQuestions(questions, selectedCategories), Math.random, questionCount === 'all' ? available : questionCount));
    setNeedsReplacementConfirmation(false);
    setPracticing(true);
  }
  function confirmReplacement() {
    if (needsReplacementConfirmation || session && !sessionFinished(session)) {
      return window.confirm('Starting a new session will replace your previous saved progress. Continue?');
    }
    return true;
  }
  function startNewSession() {
    if (!confirmReplacement()) return;
    setSession(null);
    setNeedsReplacementConfirmation(false);
    setPracticing(false);
  }

  return (
    <>
      <header className="site-header"><span className="brand-mark" aria-hidden="true">Rr</span><div><strong>Reagent Roundup</strong><span>Cedarville University · Organic Chemistry</span></div></header>
      {storageNotice && <div className="storage-notice" role="alert">{storageNotice}</div>}
      {practicing && session ? <Practice session={session} dispatch={action => setSession(current => current ? transition(current, action) : current)} onReturn={() => setPracticing(false)} /> : <main>
        <section className="introduction" aria-labelledby="page-title">
          <p className="eyebrow">REACTION REAGENT PRACTICE</p>
          <h1 id="page-title">Organic Chemistry:<br /><span>Choose the Reagents</span></h1>
          <p className="lead">Examine the starting material and product for each reaction. Select the reagents and conditions that would accomplish the transformation.</p>
          <p>Drag your chosen answer onto the reaction arrow.</p>
          <p>You have up to three attempts per question. After an incorrect answer, you may request a hint. When you answer correctly or use all three attempts, you will see the correct answer and an explanation.</p>
          <aside className="stage-note"><strong>Automatic progress saving</strong><p>Your progress is saved automatically in this browser and browser profile. It does not sync across devices or connect to your CU Launch account.</p></aside>
        </section>
        <section className="selection-panel" aria-labelledby="selection-title">
          <div className="panel-heading"><p className="eyebrow">BUILD YOUR PRACTICE</p><h2 id="selection-title">Choose reaction categories</h2><p>Select any combination to focus your review.</p></div>
          {(session || needsReplacementConfirmation) && <div className="saved-session"><h3>{session && sessionFinished(session) ? 'Previous session results' : 'Previous session'}</h3>{session && <><p>{session.entries.filter(entry => entry.correct || entry.attempts.length === 3).length} of {session.entries.length} questions completed.</p><button className="primary-button" onClick={() => setPracticing(true)}>{sessionFinished(session) ? 'Review Previous Results' : 'Resume Previous Session'}</button></>}<button className="secondary-button" onClick={startNewSession}>Start New Session</button></div>}
          <div className="selection-tools"><label><input ref={selectAll} type="checkbox" checked={allSelected} onChange={() => selectGroups(allSelected ? [] : reactionGroups.map(({ id }) => id))} /> Select All</label><button className="text-button" onClick={() => selectGroups([])} disabled={selected.length === 0}>Clear All</button></div>
          <fieldset><legend className="sr-only">Reaction categories</legend><div className="category-grid">{reactionGroups.map(({ id, label }) => <label className={`category-option ${selected.includes(id) ? 'selected' : ''}`} key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} /><span>{label}</span></label>)}</div></fieldset>
          <fieldset className="session-length" aria-describedby="session-length-note"><legend>Number of questions</legend><div className="length-options">{([5, 10, 15, 20, 'all'] as const).map(count => {
            const disabled = count === 'all' ? available === 0 : available < count;
            return <label key={count} className={`length-option ${disabled ? 'disabled' : ''} ${questionCount === count ? 'selected' : ''}`}><input type="radio" name="question-count" value={count} checked={questionCount === count} disabled={disabled} onChange={() => setQuestionCount(count)} /><span>{count === 'all' ? 'All available' : count}</span></label>;
          })}</div><p id="session-length-note">Options are available when the selected categories contain enough questions. If a chosen number becomes unavailable, the selection returns to All available.</p></fieldset>
          <div className="start-area"><p role="status"><strong>{available}</strong> questions available <span>· {selected.length} of {reactionGroups.length} groups selected</span></p><button className="start-button" disabled={!selected.length || !available} onClick={startPractice}>Start Now <span aria-hidden="true">→</span></button></div>
        </section>
      </main>}
      <footer>Choose your focus. Build your confidence.</footer>
    </>
  );
}
