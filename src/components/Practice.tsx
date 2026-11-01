import { useEffect, useRef, useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { reactionCategories } from '../data/categories';
import { isComplete, type PracticeEntry, type PracticeSession, type PracticeAction } from '../lib/practice';

function AnswerChoice({ answer, index, selected, disabled, onSelect }: { answer: string; index: number; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: `choice-${index}`, data: { answer }, disabled });
  return <div ref={setNodeRef} className={`answer-choice ${selected ? 'chosen' : ''} ${disabled ? 'unavailable' : ''} ${isDragging ? 'dragging' : ''}`}>
    <button className="answer-select" aria-pressed={selected} disabled={disabled} onClick={onSelect}>{answer}</button>
    <button ref={setActivatorNodeRef} {...attributes} {...listeners} tabIndex={-1} aria-hidden="true" className="drag-handle" disabled={disabled} title="Drag answer onto the reaction arrow">⠿</button>
  </div>;
}
function ReactionArrow({ entry }: { entry: PracticeEntry }) {
  const { setNodeRef, isOver } = useDroppable({ id: `arrow-${entry.question.id}`, disabled: isComplete(entry) });
  const lastAnswer = entry.attempts.at(-1);
  return <div ref={setNodeRef} className={`reaction-target ${isOver ? 'over' : ''} ${lastAnswer ? 'submitted' : ''}`} aria-label="Reaction arrow drop target">
    <span className="drop-label">{isOver ? 'Release to submit' : lastAnswer ? `Submitted: ${lastAnswer}` : 'Drop your answer here'}</span>
    <span className="reaction-arrow" aria-hidden="true">⟶</span>
  </div>;
}

export default function Practice({ session, dispatch, onReturn }: { session: PracticeSession; dispatch: (action: PracticeAction) => void; onReturn: () => void }) {
  const entry = session.entries[session.currentIndex];
  return <main className="practice-main">{entry ? <Question key={entry.question.id} entry={entry} number={session.currentIndex + 1} total={session.entries.length} dispatch={dispatch} onReturn={onReturn} /> :
    <section className="completion-panel"><h1>Practice complete</h1><p>You completed all {session.entries.length} questions in this session.</p><p>Scoring, detailed results, and saved progress will be added in Stage 4.</p><button className="primary-button" onClick={onReturn}>Return to Introduction</button></section>}</main>;
}

function Question({ entry, number, total, dispatch, onReturn }: { entry: PracticeEntry; number: number; total: number; dispatch: (action: PracticeAction) => void; onReturn: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }));
  const done = isComplete(entry);
  const question = entry.question;
  const category = reactionCategories.find(c => c.id === question.category)?.label;
  function submit(answer: string) {
    dispatch({ type: 'submit', questionId: question.id, answer });
    setSelected(null);
  }
  function drop(event: DragEndEvent) {
    setDragged(null);
    if (event.over?.id !== `arrow-${question.id}`) return;
    const answer: unknown = event.active.data.current?.answer;
    if (typeof answer === 'string') submit(answer);
  }
  const feedback = entry.correct ? 'Correct!' : entry.attempts.length >= 3 ? 'Incorrect. You have used all three attempts.' : entry.attempts.length > 0 ? 'Incorrect. Try again.' : '';
  return <section aria-labelledby="question-heading">
    <div className="practice-top"><div><p className="eyebrow">REAGENT PRACTICE</p><h1 ref={heading} tabIndex={-1} id="question-heading">Question {number} of {total}</h1></div><button className="text-button" onClick={onReturn}>Return to Introduction</button></div>
    <div className="progress-row"><progress aria-label="Questions completed" value={number - 1 + Number(done)} max={total} /><strong>{3 - entry.attempts.length} attempts remaining</strong></div>
    <DndContext sensors={sensors} onDragStart={({ active }) => setDragged(String(active.data.current?.answer ?? ''))} onDragEnd={drop} onDragCancel={() => setDragged(null)} accessibility={{ screenReaderInstructions: { draggable: 'Select an answer button, then activate Submit Selected Answer. Drag handles support mouse and touch.' } }}>
      <div className="reaction-layout">
        <figure><figcaption>Starting material</figcaption><img src={import.meta.env.BASE_URL + question.reactant.svgPath} alt={question.reactant.alt.split(',')[0]} /></figure>
        <ReactionArrow entry={entry} />
        <figure><figcaption>Product</figcaption><img src={import.meta.env.BASE_URL + question.product.svgPath} alt={question.product.alt.split(',')[0]} /></figure>
      </div>
      <p id="answer-instructions" className="practice-instructions">Drag an answer by its handle onto the arrow, or select an answer and use Submit Selected Answer.</p>
      <div className="answer-grid" role="group" aria-label="Answer choices" aria-describedby="answer-instructions">{entry.choices.map((answer, index) => <AnswerChoice key={answer} answer={answer} index={index} selected={selected === answer} disabled={done || entry.attempts.includes(answer)} onSelect={() => setSelected(answer)} />)}</div>
      <DragOverlay dropAnimation={null}>{dragged ? <div className="drag-preview">{dragged}</div> : null}</DragOverlay>
    </DndContext>
    <div className="submission-row"><span>{selected ? `Selected: ${selected}` : 'No answer selected'}</span><button className="primary-button" disabled={!selected || done || entry.attempts.includes(selected)} onClick={() => selected && submit(selected)}>Submit Selected Answer</button></div>
    <div className={`feedback ${feedback ? 'visible' : ''}`} aria-live="polite" aria-atomic="true"><strong>{feedback}</strong>{feedback && !done && <p>{3 - entry.attempts.length} attempts remaining.</p>}</div>
    {!done && entry.attempts.length > 0 && !entry.hintUsed && <div className="hint-offer"><span>Would you like a hint?</span><button className="secondary-button" onClick={() => dispatch({ type: 'hint', questionId: question.id })}>Show Hint</button></div>}
    {entry.hintUsed && <aside className="hint-box" aria-live="polite"><strong>Hint</strong><p>{question.hint}</p></aside>}
    {done && <div className="explanation"><h2>Correct answer: {question.correctAnswer}</h2><p><strong>Reaction type:</strong> {category}</p><p>{question.explanation}</p><button className="primary-button" onClick={() => dispatch({ type: 'next', questionId: question.id })}>{number === total ? 'Finish Practice' : 'Next Question'}</button></div>}
  </section>;
}
