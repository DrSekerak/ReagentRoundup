import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { reactionGroups } from './data/categories';

describe('introduction', () => {
  it.each([5, 10, 15, 20])('starts a session with %i questions when enough are available', async count => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole('checkbox', { name: 'Nucleophilic Substitution' }));
    await user.click(screen.getByRole('radio', { name: String(count) }));
    await user.click(screen.getByRole('button', { name: /Start Now/ }));
    expect(screen.getByRole('heading', { name: `Question 1 of ${count}` })).toBeVisible();
  });
  it('disables unavailable lengths and resets a length made invalid by category changes', async () => {
    const user = userEvent.setup(); render(<App />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Nucleophilic Substitution' }));
    await user.click(screen.getByRole('radio', { name: '20' }));
    await user.click(screen.getByRole('checkbox', { name: 'Radical Halogenation' }));
    await user.click(screen.getByRole('checkbox', { name: 'Nucleophilic Substitution' }));
    for (const count of [5, 10]) expect(screen.getByRole('radio', { name: String(count) })).toBeEnabled();
    for (const count of [15, 20]) expect(screen.getByRole('radio', { name: String(count) })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'All available' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: /Start Now/ }));
    expect(screen.getByRole('heading', { name: 'Question 1 of 14' })).toBeVisible();
  });
  it('starts only the selected group and confirms discarding an unfinished session', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox', { name: 'Radical Halogenation' }));
    expect(screen.getByRole('button', { name: /Start Now/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /Start Now/ }));
    expect(screen.getByRole('heading', { name: 'Question 1 of 14' })).toBeVisible();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Return to Introduction' }));
    expect(screen.getByRole('heading', { name: 'Question 1 of 14' })).toBeVisible();
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Return to Introduction' }));
    expect(screen.getByRole('checkbox', { name: 'Radical Halogenation' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select All' })).toBePartiallyChecked();
    confirm.mockRestore();
  });
  it('shows three reaction groups and requires a selection before practice', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Organic Chemistry:Choose the Reagents');
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Start Now/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('0 questions available');
    expect(screen.getByText(/Refreshing or closing this page clears/)).toBeVisible();
  });

  it('supports individual selection, mixed Select All, all selection, and clearing', async () => {
    const user = userEvent.setup();
    render(<App />);
    const all = screen.getByRole('checkbox', { name: 'Select All' });
    await user.click(screen.getByRole('checkbox', { name: 'Nucleophilic Substitution' }));
    expect(all).toBePartiallyChecked();
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 groups selected');
    await user.click(all);
    for (const group of reactionGroups) expect(screen.getByRole('checkbox', { name: group.label })).toBeChecked();
    expect(all).toBeChecked();
    await user.click(all);
    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 groups selected');
    await user.click(all);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
  });

  it('allows keyboard selection and deselection of a group', async () => {
    const user = userEvent.setup();
    render(<App />);
    const bromination = screen.getByRole('checkbox', { name: 'Radical Halogenation' });
    bromination.focus();
    await user.keyboard(' ');
    expect(bromination).toBeChecked();
    await user.keyboard(' ');
    expect(bromination).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 groups selected');
  });
});
