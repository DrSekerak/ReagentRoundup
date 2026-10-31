import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

// One metadata-only fixture per category; no chemistry is added to the bank.
vi.mock('./data/questions', async () => {
  const { reactionCategories } = await import('./data/categories');
  return { questions: reactionCategories.map(({ id }) => ({ id, category: id })) };
});

describe('group selection filters underlying question categories', () => {
  it.each([
    ['Radical Halogenation', 3],
    ['Nucleophilic Substitution', 4],
    ['Elimination', 4],
  ])('%s includes all its categories', async (label, count) => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox', { name: label }));
    expect(screen.getByRole('status')).toHaveTextContent(`${count} questions available`);
    await user.click(screen.getByRole('checkbox', { name: label }));
    expect(screen.getByRole('status')).toHaveTextContent('0 questions available');
  });

  it('combines groups and clears all underlying categories', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox', { name: 'Radical Halogenation' }));
    await user.click(screen.getByRole('checkbox', { name: 'Elimination' }));
    expect(screen.getByRole('status')).toHaveTextContent('7 questions available');
    await user.click(screen.getByRole('checkbox', { name: 'Select All' }));
    expect(screen.getByRole('status')).toHaveTextContent('11 questions available');
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.getByRole('status')).toHaveTextContent('0 questions available');
  });
});
