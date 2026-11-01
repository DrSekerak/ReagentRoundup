import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Results from './Results';
import { finishFixture } from '../test/sessions';
import { createSession } from '../lib/practice';
import { questionBank } from '../data/questions';

describe('results', () => {
  it('shows scores, every category, detailed submitted answers, and navigation', async () => {
    const user = userEvent.setup(); const onReturn = vi.fn();
    render(<Results session={finishFixture()} onReturn={onReturn} />);
    expect(screen.getByRole('heading', { name: 'Practice complete' })).toHaveFocus();
    expect(screen.getByText('75.0%')).toBeVisible();
    expect(screen.getByText('6 / 12')).toBeVisible();
    expect(screen.getByText('Questions with hints used').parentElement).toHaveTextContent('2');
    const table = screen.getByRole('table', { name: 'Reaction category performance' });
    expect(within(table).getAllByRole('row')).toHaveLength(12);
    expect(screen.queryByRole('heading', { name: 'Detailed question review' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Review Results' }));
    expect(screen.getByRole('table', { name: 'Submitted answers and final results' })).toHaveTextContent('Correct on attempt 3');
    expect(screen.getByRole('table', { name: 'Submitted answers and final results' })).toHaveTextContent('Not correct after three attempts');
    await user.click(screen.getByRole('button', { name: 'Hide Detailed Review' }));
    expect(screen.queryByRole('heading', { name: 'Detailed question review' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start Another Practice Session' }));
    await user.click(screen.getByRole('button', { name: 'Return to Introduction' }));
    expect(onReturn).toHaveBeenCalledTimes(2);
  });
  it('does not expose results while practice is unfinished', () => {
    render(<Results session={createSession([questionBank[0]])} onReturn={vi.fn()} />);
    expect(screen.queryByText('SESSION RESULTS')).not.toBeInTheDocument();
  });
});
