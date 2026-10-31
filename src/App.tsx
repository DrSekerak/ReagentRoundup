import { useRef, useEffect, useState } from 'react';
import { reactionGroups, type ReactionGroup } from './data/categories';
import { questions } from './data/questions';
import { filterQuestions } from './lib/questions';

export default function App() {
  const [selected, setSelected] = useState<ReactionGroup[]>([]);
  const selectAll = useRef<HTMLInputElement>(null);
  const allSelected = selected.length === reactionGroups.length;
  const selectedCategories = reactionGroups.filter(({ id }) => selected.includes(id)).flatMap(({ categories }) => [...categories]);
  const available = filterQuestions(questions, selectedCategories).length;

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !allSelected;
  }, [selected, allSelected]);

  function toggle(id: ReactionGroup) {
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
          <aside className="stage-note"><strong>Question bank preview</strong><p>The question bank is prepared; questions requiring instructor review are excluded from the available count. Interactive practice arrives in Stage 3, with automatic progress saving in Stage 4. Saved progress will stay in this browser and profile.</p></aside>
        </section>
        <section className="selection-panel" aria-labelledby="selection-title">
          <div className="panel-heading"><p className="eyebrow">BUILD YOUR PRACTICE</p><h2 id="selection-title">Choose reaction categories</h2><p>Select any combination to focus your review.</p></div>
          <div className="selection-tools"><label><input ref={selectAll} type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : reactionGroups.map(({ id }) => id))} /> Select All</label><button className="text-button" onClick={() => setSelected([])} disabled={selected.length === 0}>Clear All</button></div>
          <fieldset><legend className="sr-only">Reaction categories</legend><div className="category-grid">{reactionGroups.map(({ id, label }) => <label className={`category-option ${selected.includes(id) ? 'selected' : ''}`} key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} /><span>{label}</span></label>)}</div></fieldset>
          <div className="start-area"><p role="status"><strong>{available}</strong> questions available <span>· {selected.length} of {reactionGroups.length} groups selected</span></p><button className="start-button" disabled aria-describedby="availability-note">Start Now <span aria-hidden="true">→</span></button><p id="availability-note" className="availability-note">Practice is not available in this Stage 2 preview. Start Now will be enabled when interactive practice is implemented in Stage 3.</p></div>
        </section>
      </main>
      <footer>Choose your focus. Build your confidence.</footer>
    </>
  );
}
