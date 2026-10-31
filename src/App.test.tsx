import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { reactionCategories } from './data/categories';

describe('Stage 1 introduction', () => {
  it('shows all eleven categories and disables practice for the empty bank', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Organic Chemistry:Choose the Reagents');
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    expect(screen.getByRole('button', { name: /Start Now/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('0 questions available');
    expect(screen.getByText(/Practice is not available/)).toBeVisible();
  });

  it('supports individual selection, mixed Select All, all selection, and clearing', async () => {
    const user = userEvent.setup();
    render(<App />);
    const all = screen.getByRole('checkbox', { name: 'Select All' });
    await user.click(screen.getByRole('checkbox', { name: 'SN2 substitution' }));
    expect(all).toBePartiallyChecked();
    expect(screen.getByRole('status')).toHaveTextContent('1 of 11 categories selected');
    await user.click(all);
    for (const category of reactionCategories) expect(screen.getByRole('checkbox', { name: category.label })).toBeChecked();
    expect(all).toBeChecked();
    await user.click(all);
    expect(screen.getByRole('status')).toHaveTextContent('0 of 11 categories selected');
    await user.click(all);
    await user.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
  });

  it('allows keyboard selection and preserves chemical typography', async () => {
    const user = userEvent.setup();
    render(<App />);
    const bromination = screen.getByRole('checkbox', { name: 'Radical bromination using Br₂' });
    bromination.focus();
    await user.keyboard(' ');
    expect(bromination).toBeChecked();
    expect(screen.getByText(/HCl\/ZnCl₂/)).toBeVisible();
  });
});
