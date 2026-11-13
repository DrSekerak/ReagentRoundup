import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { alkeneSection, reactionCategories } from './data/categories';

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
    ['Formation of alkoxides from alcohols', 1],
    ['Markovnikov additions', 6],
    ['anti-Markovnikov additions', 2],
    ['Hydrogenation', 1],
    ['Carbene reactions', 3],
    ['Epoxidation & ring opening', 4],
    ['Dihydroxylation & oxidative cleavages', 3],
    ['Olefin metathesis', 1],
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
    expect(screen.getByRole('status')).toHaveTextContent(`${reactionCategories.length} questions available`);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.getByRole('status')).toHaveTextContent('0 questions available');
  });

  it('selects Unit 4, shows partial selection, and leaves existing groups selected when clearing the heading', async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('checkbox', { name: 'Elimination' }));
    const heading = screen.getByRole('checkbox', { name: alkeneSection.label });
    await user.click(heading);
    expect(heading).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('25 questions available');
    await user.click(screen.getByRole('checkbox', { name: 'Markovnikov additions' }));
    expect(heading).toBePartiallyChecked();
    expect(screen.getByRole('status')).toHaveTextContent('19 questions available');
    heading.focus(); await user.keyboard(' ');
    expect(heading).toBeChecked();
    await user.keyboard(' ');
    expect(heading).not.toBeChecked();
    expect(heading).not.toBePartiallyChecked();
    expect(screen.getByRole('checkbox', { name: 'Elimination' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('4 questions available');
  });
});
