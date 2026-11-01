import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { questionBank } from './data/questions';
import { createSession } from './lib/practice';
import { STORAGE_KEY, encodeProgress } from './lib/progress';
import { finishFixture } from './test/sessions';

function seed(completed = false) {
  window.localStorage.setItem(STORAGE_KEY, encodeProgress({ selectedGroups: ['radical-halogenation'], questionCount: 'all',
    session: completed ? finishFixture() : createSession(questionBank.slice(0, 3), () => .999) }));
}
describe('automatic saving and session restoration', () => {
  it('restores attempts, hints, question/answer order and navigation across app reloads', async () => {
    const user = userEvent.setup(); seed();
    let view = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Resume Previous Session' }));
    const order = screen.getAllByRole('button', { pressed: false }).map(b => b.textContent);
    await user.click(screen.getByRole('button', { name: questionBank[0].distractors[0] }));
    await user.click(screen.getByRole('button', { name: 'Submit Selected Answer' }));
    await user.click(screen.getByRole('button', { name: 'Show Hint' }));
    view.unmount();
    view = render(<App />);
    expect(screen.getByRole('checkbox', { name: 'Radical Halogenation' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Resume Previous Session' }));
    expect(screen.getByRole('heading', { name: 'Question 1 of 3' })).toBeVisible();
    expect(screen.getAllByRole('button', { pressed: false }).map(b => b.textContent)).toEqual(order);
    expect(screen.getByRole('button', { name: questionBank[0].distractors[0] })).toBeDisabled();
    expect(screen.getByText(questionBank[0].hint)).toBeVisible();
    expect(screen.getByText('2 attempts remaining')).toBeVisible();
    await user.click(screen.getByRole('button', { name: questionBank[0].correctAnswer }));
    await user.click(screen.getByRole('button', { name: 'Submit Selected Answer' }));
    await user.click(screen.getByRole('button', { name: 'Next Question' }));
    view.unmount(); render(<App />);
    await user.click(screen.getByRole('button', { name: 'Resume Previous Session' }));
    expect(screen.getByRole('heading', { name: 'Question 2 of 3' })).toBeVisible();
    expect(screen.getByRole('img', { name: questionBank[1].reactant.alt })).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveValue(1);
  });
  it('preserves saved work when Start Now replacement is cancelled', async () => {
    const user = userEvent.setup(); seed(); render(<App />);
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: /Start Now/ }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(saved);
    await user.click(screen.getByRole('button', { name: 'Resume Previous Session' }));
    expect(screen.getByRole('heading', { name: 'Question 1 of 3' })).toBeVisible();
    confirm.mockRestore();
  });
  it('keeps incompatible saves untouched until replacement is confirmed', async () => {
    const user = userEvent.setup(); window.localStorage.setItem(STORAGE_KEY, '{broken'); render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be restored/);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{broken');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Start New Session' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{broken');
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Start New Session' }));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).session).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    confirm.mockRestore();
  });
  it('restores completed summaries and detailed reviews without exposing results during practice', async () => {
    const user = userEvent.setup(); seed(true); render(<App />);
    await user.click(screen.getByRole('button', { name: 'Review Previous Results' }));
    expect(screen.getByText('75.0%')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Review Results' }));
    expect(screen.getByRole('table', { name: 'Submitted answers and final results' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Start Another Practice Session' }));
    expect(screen.getByRole('heading', { name: 'Choose reaction categories' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Review Previous Results' })).toBeVisible();
  });
  it('shows an actionable storage failure without preventing practice', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Progress could not be saved');
    await user.click(screen.getByRole('checkbox', { name: 'Radical Halogenation' }));
    await user.click(screen.getByRole('button', { name: /Start Now/ }));
    expect(screen.getByRole('heading', { name: 'Question 1 of 14' })).toBeVisible();
    setItem.mockRestore();
  });
});
