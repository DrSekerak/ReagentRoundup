import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChemistryRabbit from './ChemistryRabbit';
import App from '../App';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Pip’s encouragement', () => {
  it('visits occasionally, leaves automatically, and can be turned off', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<ChemistryRabbit />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole('complementary')).toHaveTextContent('great potential');
    act(() => vi.advanceTimersByTime(12000));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(48000));
    expect(screen.getByRole('complementary')).toHaveTextContent('stronger bond');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Pip’s encouragement' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pip’s encouragement: on' }));
    act(() => vi.advanceTimersByTime(180000));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pip’s encouragement: off' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not show encouragement in a hidden tab and clears timers on unmount', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const { unmount } = render(<ChemistryRabbit />);
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can resume visits after being turned off', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<ChemistryRabbit />);
    fireEvent.click(screen.getByRole('button', { name: 'Pip’s encouragement: on' }));
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Pip’s encouragement: off' }));
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole('complementary')).toHaveTextContent('Pip, your lab buddy');
  });

  it('visits during practice without changing the answer, progress, or keyboard focus', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<App />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Radical Halogenation' }));
    fireEvent.click(screen.getByRole('button', { name: /Start Now/ }));
    const heading = screen.getByRole('heading', { name: 'Question 1 of 14' });
    const answer = screen.getAllByRole('button', { pressed: false })[0];
    answer.focus();
    fireEvent.click(answer);
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole('complementary', { name: 'Encouragement from Pip the chemistry rabbit' })).toBeVisible();
    expect(heading).toBeVisible();
    expect(answer).toHaveAttribute('aria-pressed', 'true');
    expect(answer).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Submit Selected Answer' })).toBeEnabled();
    expect(screen.getByRole('progressbar')).toHaveValue(0);
  });
});
