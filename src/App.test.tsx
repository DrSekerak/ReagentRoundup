import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { reactionGroups } from './data/categories';

describe('introduction', () => {
  it('shows three reaction groups and disables practice pending Stage 3', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Organic Chemistry:Choose the Reagents');
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Start Now/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('0 questions available');
    expect(screen.getByText(/Practice is not available/)).toBeVisible();
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
