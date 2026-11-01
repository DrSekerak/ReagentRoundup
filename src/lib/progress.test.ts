import { describe, expect, it } from 'vitest';
import { questionBank } from '../data/questions';
import { createSession, transition } from './practice';
import { STORAGE_KEY, createLocalProgressRepository, decodeProgress, encodeProgress, type Progress } from './progress';
import { finishFixture } from '../test/sessions';

function fixture(): Progress {
  let session = createSession(questionBank.slice(0, 14), () => .5, 5);
  const q = session.entries[0].question;
  session = transition(session, { type: 'submit', questionId: q.id, answer: q.distractors[0] });
  session = transition(session, { type: 'hint', questionId: q.id });
  session = transition(session, { type: 'submit', questionId: q.id, answer: q.distractors[1] });
  return { selectedGroups: ['radical-halogenation'], questionCount: 5, session };
}
describe('saved progress', () => {
  it('restores fixed question/answer order, attempts, disabled answers, and a visible hint', () => {
    const progress = fixture();
    const restored = decodeProgress(encodeProgress(progress), questionBank);
    expect(restored).toEqual(progress);
    const session = restored.session!;
    const entry = session.entries[0];
    expect(entry.attempts).toHaveLength(2);
    expect(entry.hintUsed).toBe(true);
    expect(transition(session, { type: 'submit', questionId: entry.question.id, answer: entry.attempts[0] })).toBe(session);
    const answered = transition(session, { type: 'submit', questionId: entry.question.id, answer: entry.question.correctAnswer });
    expect(answered.entries[0].attempts).toHaveLength(3);
    expect(answered.entries[0].correct).toBe(true);
    const next = transition(answered, { type: 'next', questionId: entry.question.id });
    expect(decodeProgress(encodeProgress({ ...progress, session: next }), questionBank).session?.currentIndex).toBe(1);
  });
  it('restores preferences and completed results with correct-attempt and completion metadata', () => {
    const progress: Progress = { selectedGroups: ['radical-halogenation'], questionCount: 'all', session: finishFixture() };
    const saved = JSON.parse(encodeProgress(progress));
    expect(saved.session.completed).toBe(true);
    expect(saved.session.completedCount).toBe(4);
    expect(saved.session.entries.map((e: { correctAttempt: number | null }) => e.correctAttempt)).toEqual([1, 2, 3, null]);
    expect(decodeProgress(JSON.stringify(saved), questionBank)).toEqual(progress);
    expect(decodeProgress(encodeProgress({ ...progress, session: null }), questionBank).session).toBeNull();
  });
  it.each([
    ['wrong version', (s: Record<string, unknown>) => { s.version = 99; }],
    ['invalid groups', (s: Record<string, unknown>) => { s.selectedGroups = ['unknown']; }],
    ['invalid count', (s: Record<string, unknown>) => { s.questionCount = 12; }],
  ])('rejects %s', (_, mutate) => {
    const saved = JSON.parse(encodeProgress(fixture())); mutate(saved);
    expect(() => decodeProgress(JSON.stringify(saved), questionBank)).toThrow();
  });
  it('rejects changed/removed source questions instead of restoring outdated copies', () => {
    const progress = fixture(); const q = progress.session!.entries[0].question;
    const raw = encodeProgress(progress);
    expect(() => decodeProgress(raw, questionBank.filter(x => x.id !== q.id))).toThrow();
    expect(() => decodeProgress(raw, questionBank.map(x => x.id === q.id ? { ...x, correctAnswer: 'changed' } : x))).toThrow();
    expect(() => decodeProgress('{bad json', questionBank)).toThrow();
    expect(() => decodeProgress('null', questionBank)).toThrow();
  });
  it('rejects impossible counters, answer permutations, and attempt histories', () => {
    const base = JSON.parse(encodeProgress(fixture()));
    const mutations: ((s: typeof base) => void)[] = [
      s => { s.session.entries[1] = s.session.entries[0]; },
      s => { s.session.entries[0].choices[0] = s.session.entries[0].choices[1]; },
      s => { s.session.entries[0].attempts.push('unknown'); },
      s => { s.session.entries[0].attemptsUsed = 1; },
      s => { s.session.entries[0].correct = true; },
      s => { s.session.entries[0].correctAttempt = 1; },
      s => { s.session.currentIndex = 1; },
      s => { s.session.currentIndex = 999; },
      s => { s.session.completed = true; },
      s => { s.session.completedCount = 1; },
      s => { s.session.entries[1].hintUsed = true; },
      s => { s.session.categories = ['unknown']; },
    ];
    for (const mutate of mutations) {
      const saved = structuredClone(base); mutate(saved);
      expect(() => decodeProgress(JSON.stringify(saved), questionBank)).toThrow();
    }
  });
  it('uses the versioned repository and handles inaccessible/quota-limited storage', () => {
    const repository = createLocalProgressRepository(() => window.localStorage);
    expect(repository.save(fixture())).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(repository.load(questionBank).progress).toEqual(fixture());
    const unavailable = createLocalProgressRepository(() => { throw new Error('blocked'); });
    expect(unavailable.load(questionBank).notice).toMatch(/unavailable/);
    expect(unavailable.save(fixture())).toMatch(/could not be saved/);
    const full = createLocalProgressRepository(() => ({ getItem: () => null, setItem: () => { throw new Error('quota'); } }));
    expect(full.save(fixture())).toMatch(/could not be saved/);
    window.localStorage.setItem(STORAGE_KEY, '{broken');
    expect(repository.load(questionBank).needsReplacementConfirmation).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{broken');
  });
});
