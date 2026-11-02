import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccountProgress from './AccountProgress';
import { encodeProgress, type Progress } from '../lib/progress';

const progress: Progress = { selectedGroups: ['radical-halogenation'], questionCount: 5, session: null };
const reply = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('explicit account progress transfers', () => {
  it('keeps progress local until Save to account and sends the expected revision', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(reply({ document: null, revision: 0 })).mockResolvedValueOnce(reply({ revision: 1 }));
    vi.stubGlobal('fetch', fetch);
    render(<AccountProgress progress={progress} onLoad={vi.fn()} canSave />);
    expect(fetch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Save to account' }));
    expect(await screen.findByText('Progress saved to your Cedarville account.')).toBeVisible();
    const [path, options] = fetch.mock.calls[1];
    expect(path).toBe('/api/progress');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ document: JSON.parse(encodeProgress(progress)), revision: 0 });
  });
  it('preserves an existing account save when replacement is cancelled', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ document: JSON.parse(encodeProgress(progress)), revision: 3 }));
    vi.stubGlobal('fetch', fetch);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AccountProgress progress={progress} onLoad={vi.fn()} canSave />);
    await userEvent.click(screen.getByRole('button', { name: 'Save to account' }));
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('requires confirmation to load and validates before replacing browser progress', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ document: JSON.parse(encodeProgress(progress)), revision: 3 })));
    const onLoad = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AccountProgress progress={progress} onLoad={onLoad} canSave />);
    await userEvent.click(screen.getByRole('button', { name: 'Load from account' }));
    expect(onLoad).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Load from account' }));
    expect(onLoad).toHaveBeenCalledWith(progress);
    expect(await screen.findByText(/Account progress loaded/)).toBeVisible();
  });
  it('leaves local data alone after corrupt data, conflict or session expiration', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(reply({ document: { version: 99 }, revision: 3 }))
      .mockResolvedValueOnce(reply({ document: null, revision: 0 })).mockResolvedValueOnce(reply({ error: 'Account progress changed.' }, 409))
      .mockResolvedValueOnce(reply({}, 401));
    vi.stubGlobal('fetch', fetch);
    const onLoad = vi.fn();
    render(<AccountProgress progress={progress} onLoad={onLoad} canSave />);
    await userEvent.click(screen.getByRole('button', { name: 'Load from account' }));
    expect(await screen.findByText(/could not be loaded/)).toBeVisible();
    expect(onLoad).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Save to account' }));
    expect(await screen.findByText('Account progress changed.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Save to account' }));
    expect(await screen.findByText(/Your sign-in has expired/)).toBeVisible();
    expect(onLoad).not.toHaveBeenCalled();
  });
  it('prevents uploading incompatible browser progress', () => {
    render(<AccountProgress progress={progress} onLoad={vi.fn()} canSave={false} />);
    expect(screen.getByRole('button', { name: 'Save to account' })).toBeDisabled();
  });
});
