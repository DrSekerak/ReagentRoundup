import { useState } from 'react';
import { questions } from '../data/questions';
import { decodeProgress, encodeProgress, type Progress } from '../lib/progress';

interface AccountSave { document: unknown; revision: number; updated_at: string | null }
async function responseBody(response: Response) {
  if (response.status === 401) throw new Error('Your sign-in has expired. Sign in again before saving to your account. Browser progress is unchanged.');
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Account saving is unavailable. Browser progress is unchanged.');
  return body;
}

export default function AccountProgress({ progress, onLoad, canSave }: { progress: Progress; onLoad: (progress: Progress) => void; canSave: boolean }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('Browser progress saves automatically. Use these buttons to copy progress to or from your Cedarville account.');
  const [revision, setRevision] = useState<number | null>(null);

  async function save() {
    setBusy(true);
    try {
      let expected = revision;
      if (expected === null) {
        const current: AccountSave = await responseBody(await fetch('/api/progress', { cache: 'no-store' }));
        expected = current.revision;
        if (current.document !== null && !window.confirm('Replace your saved account progress with the progress in this browser?')) return;
      }
      const saved = await responseBody(await fetch('/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: JSON.parse(encodeProgress(progress)), revision: expected }) }));
      setRevision(saved.revision);
      setNotice('Progress saved to your Cedarville account.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Account saving is unavailable. Browser progress is unchanged.'); }
    finally { setBusy(false); }
  }
  async function load() {
    setBusy(true);
    try {
      const saved: AccountSave = await responseBody(await fetch('/api/progress', { cache: 'no-store' }));
      if (saved.document === null) { setNotice('No progress has been saved to your account yet.'); return; }
      const restored = decodeProgress(JSON.stringify(saved.document), questions);
      if (!window.confirm('Loading account progress will replace the progress currently saved in this browser. Continue?')) return;
      onLoad(restored);
      setRevision(saved.revision);
      setNotice('Account progress loaded. Automatic saving continues in this browser.');
    } catch { setNotice('Account progress could not be loaded. Your current browser progress is unchanged. Try signing in again if your session expired.'); }
    finally { setBusy(false); }
  }
  return <aside className="account-progress" aria-label="Cedarville account progress">
    <div className="account-actions"><button className="secondary-button" onClick={save} disabled={busy || !canSave}>Save to account</button><button className="secondary-button" onClick={load} disabled={busy}>Load from account</button><a href="/api/auth/signout">Sign out</a><a href="/login">Sign in again</a></div>
    <p aria-live="polite">{notice}</p>
  </aside>;
}
