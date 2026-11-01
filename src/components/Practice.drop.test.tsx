import { useState, type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DndContext, DragEndEvent } from '@dnd-kit/core';
import Practice from './Practice';
import { questionBank } from '../data/questions';
import { createSession, transition } from '../lib/practice';

// Exercise the drop/cancel boundary while leaving draggable/droppable hooks real.
// Mouse drops are also verified manually in the browser; jsdom has no layout.
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return { ...actual, DndContext: (props: ComponentProps<typeof DndContext>) => {
    const drop = (valid: boolean) => props.onDragEnd?.({
      active: { id: 'choice-0', data: { current: { answer: questionBank[0].distractors[0] } } },
      over: valid ? { id: `arrow-${questionBank[0].id}` } : null,
    } as unknown as DragEndEvent);
    return <actual.DndContext {...props}>{props.children}<button onClick={() => drop(false)}>Test outside drop</button><button onClick={() => { drop(true); drop(true); }}>Test duplicate valid drop</button><button onClick={() => props.onDragCancel?.({} as DragEndEvent)}>Test cancelled drag</button></actual.DndContext>;
  } };
});
function Harness() {
  const [session, setSession] = useState(() => createSession([questionBank[0]]));
  return <Practice session={session} dispatch={action => setSession(s => transition(s, action))} onReturn={() => {}} />;
}
describe('drop validation', () => {
  it('ignores outside/cancelled drops and counts a duplicated valid event once', async () => {
    const user = userEvent.setup(); render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Test outside drop' }));
    await user.click(screen.getByRole('button', { name: 'Test cancelled drag' }));
    expect(screen.getByText('3 attempts remaining')).toBeVisible();
    expect(screen.queryByText('Incorrect. Try again.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Test duplicate valid drop' }));
    expect(screen.getByText('2 attempts remaining')).toBeVisible();
    expect(screen.getByText('Incorrect. Try again.')).toBeVisible();
    expect(screen.getByRole('button', { name: questionBank[0].distractors[0] })).toBeDisabled();
    expect(screen.getByText(`Submitted: ${questionBank[0].distractors[0]}`)).toBeVisible();
  });
});
