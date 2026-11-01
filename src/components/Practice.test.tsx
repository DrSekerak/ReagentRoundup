import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Practice from './Practice';
import { questionBank } from '../data/questions';
import { createSession, transition } from '../lib/practice';

function Harness({ count = 1 }: { count?: number }) {
  const [session, setSession] = useState(() => createSession(questionBank.slice(0, count), () => .999));
  return <Practice session={session} dispatch={action => setSession(s => transition(s, action))} onReturn={vi.fn()} />;
}
describe('question interaction', () => {
  it('shows structures, chemical formulas and eight choices without disclosing the category or hint', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Question 1 of 1' })).toHaveFocus();
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(8);
    expect(screen.getByRole('img', { name: 'Ethane' })).toHaveAttribute('src', expect.stringContaining('structures/pdf-01-reactant.svg'));
    expect(screen.getByRole('button', { name: 'HCl / ZnCl₂' })).toBeVisible();
    expect(screen.queryByText('Radical chlorination')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show Hint' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Selected Answer' })).toBeDisabled();
  });
  it('uses keyboard selection, then locks correct submissions and finishes the session', async () => {
    const user = userEvent.setup(); render(<Harness />);
    screen.getByRole('button', { name: 'Cl₂, hν' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Cl₂, hν' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Submit Selected Answer' }));
    expect(screen.getByText('Correct!')).toBeVisible();
    expect(screen.getByText('Radical chlorination')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cl₂, hν' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toHaveValue(1);
    await user.click(screen.getByRole('button', { name: 'Finish Practice' }));
    expect(screen.getByRole('heading', { name: 'Practice complete' })).toBeVisible();
  });
  it('withholds the answer for two mistakes, keeps hints visible, and reveals after the third', async () => {
    const user = userEvent.setup(); render(<Harness />);
    for (const [index, answer] of questionBank[0].distractors.slice(0, 3).entries()) {
      await user.click(screen.getByRole('button', { name: answer }));
      await user.click(screen.getByRole('button', { name: 'Submit Selected Answer' }));
      expect(screen.getByRole('button', { name: answer })).toBeDisabled();
      if (index < 2) expect(screen.queryByRole('heading', { name: /Correct answer:/ })).not.toBeInTheDocument();
      if (index === 0) await user.click(screen.getByRole('button', { name: 'Show Hint' }));
      expect(screen.getByText(questionBank[0].hint)).toBeVisible();
    }
    expect(screen.getByText('Incorrect. You have used all three attempts.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Correct answer: Cl₂, hν' })).toBeVisible();
    expect(screen.getByText('0 attempts remaining')).toBeVisible();
  });
  it('moves forward once, resets selection/hints, and focuses the next question', async () => {
    const user = userEvent.setup(); render(<Harness count={2} />);
    await user.click(screen.getByRole('button', { name: 'Cl₂, hν' }));
    await user.click(screen.getByRole('button', { name: 'Submit Selected Answer' }));
    await user.click(screen.getByRole('button', { name: 'Next Question' }));
    expect(screen.getByRole('heading', { name: 'Question 2 of 2' })).toHaveFocus();
    expect(screen.getByText('3 attempts remaining')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Submit Selected Answer' })).toBeDisabled();
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
  });
});
