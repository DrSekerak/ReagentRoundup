import { useRef, useEffect, useState } from 'react';
import { reactionCategories, type ReactionCategory } from './data/categories';
import { questions } from './data/questions';
import { filterQuestions } from './lib/questions';

export default function App() {
  const [selected, setSelected] = useState<ReactionCategory[]>([]);
  const selectAll = useRef<HTMLInputElement>(null);
  const allSelected = selected.length === reactionCategories.length;
  const available = filterQuestions(questions, selected).length;

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !allSelected;
  }, [selected, allSelected]);

  function toggle(id: ReactionCategory) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  return (
    <>
      <header className="site-header"><span className="brand-mark" aria-hidden="true">Rr</span><div><strong>Reagent Roundup</strong><span>Cedarville University · Organic Chemistry</span></div></header>
      <main>
        <section className="introduction" aria-labelledby="page-title">
          <p className="eyebrow">REACTION REAGENT PRACTICE</p>
          <h1 id="page-title">Organic Chemistry:<br /><span>Choose the Reagents</span></h1>
          <p className="lead">Examine the starting material and product for each reaction. Select the reagents and conditions that would accomplish the transformation.</p>
          <p>Drag your chosen answer onto the reaction arrow.</p>
          <p>You have up to three attempts per question. After an incorrect answer, you may request a hint. When you answer correctly or use all three attempts, you will see the correct answer and an explanation.</p>
          <p>Your progress will be saved automatically.</p>
          <aside className="stage-note"><strong>Foundation preview</strong><p>Practice questions arrive in Stage 2. Interactive practice and automatic progress saving will be added in later stages. When available, saved progress will stay in this browser and profile.</p></aside>
        </section>
        <section className="selection-panel" aria-labelledby="selection-title">
          <div className="panel-heading"><p className="eyebrow">BUILD YOUR PRACTICE</p><h2 id="selection-title">Choose reaction categories</h2><p>Select any combination to focus your review.</p></div>
          <div className="selection-tools"><label><input ref={selectAll} type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : reactionCategories.map(({ id }) => id))} /> Select All</label><button className="text-button" onClick={() => setSelected([])} disabled={selected.length === 0}>Clear All</button></div>
          <fieldset><legend className="sr-only">Reaction categories</legend><div className="category-grid">{reactionCategories.map(({ id, label }) => <label className={`category-option ${selected.includes(id) ? 'selected' : ''}`} key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} /><span>{label}</span></label>)}</div></fieldset>
          <div className="start-area"><p role="status"><strong>{available}</strong> questions available <span>· {selected.length} of {reactionCategories.length} categories selected</span></p><button className="start-button" disabled={selected.length === 0 || available === 0} aria-describedby="availability-note">Start Now <span aria-hidden="true">→</span></button><p id="availability-note" className="availability-note">The question bank awaits Stage 2 preparation and instructor review. Practice is not available in this Stage 1 preview.</p></div>
        </section>
      </main>
      <footer>Choose your focus. Build your confidence.</footer>
    </>
  );
}
