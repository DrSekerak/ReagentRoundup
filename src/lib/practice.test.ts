import { describe, expect, it } from 'vitest';
import { questionBank } from '../data/questions';
import { createSession, isComplete, shuffle, transition } from './practice';

describe('practice sessions', () => {
  it.each([5, 10, 15, 20])('samples %i unique questions from the full shuffled pool', count => {
    const session = createSession(questionBank, () => 0, count);
    expect(session.entries).toHaveLength(count);
    expect(new Set(session.entries.map(e => e.question.id)).size).toBe(count);
    const firstQuestions = new Set(questionBank.slice(0, count).map(q => q.id));
    expect(session.entries.some(e => !firstQuestions.has(e.question.id))).toBe(true);
    for (const entry of session.entries) expect(new Set(entry.choices)).toEqual(new Set([entry.question.correctAnswer, ...entry.question.distractors]));
  });
  it('rejects lengths outside the available pool', () => {
    for (const count of [-1, 1.5, 61]) expect(() => createSession(questionBank, Math.random, count)).toThrow(RangeError);
  });
  it('shuffles copies without omissions or repeats and independently shuffles all eight choices', () => {
    const eligible = questionBank.slice(0, 14);
    let seed = 12;
    const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
    const session = createSession(eligible, rng);
    expect(new Set(session.entries.map(e => e.question.id)).size).toBe(14);
    expect(session.entries.map(e => e.question.id).sort()).toEqual(eligible.map(q => q.id).sort());
    expect(session.entries.map(e => e.question.id)).not.toEqual(eligible.map(q => q.id));
    expect(new Set(session.entries.map(e => e.choices.indexOf(e.question.correctAnswer))).size).toBeGreaterThan(1);
    for (const entry of session.entries) {
      expect(entry.choices).toHaveLength(8);
      expect(new Set(entry.choices)).toEqual(new Set([entry.question.correctAnswer, ...entry.question.distractors]));
    }
    expect(eligible[0].id).toBe('pdf-01');
    expect(shuffle([], rng)).toEqual([]);
    expect(createSession([]).entries).toEqual([]);
  });
  it('permits three attempts, rejects duplicates/unknown answers, and locks completed questions', () => {
    let s = createSession([questionBank[0]]);
    const q = questionBank[0];
    const submit = (answer: string) => ({ type: 'submit' as const, questionId: q.id, answer });
    expect(transition(s, { type: 'hint', questionId: q.id })).toBe(s);
    expect(transition(s, { type: 'next', questionId: q.id })).toBe(s);
    expect(transition(s, submit('not an option'))).toBe(s);
    s = transition(s, submit(q.distractors[0]));
    expect(transition(s, submit(q.distractors[0]))).toBe(s);
    s = transition(s, { type: 'hint', questionId: q.id });
    expect(s.entries[0].hintUsed).toBe(true);
    expect(s.entries[0].attempts).toHaveLength(1);
    s = transition(s, submit(q.distractors[1]));
    expect(s.entries[0].hintUsed).toBe(true);
    s = transition(s, submit(q.distractors[2]));
    expect(isComplete(s.entries[0])).toBe(true);
    expect(s.entries[0].correct).toBe(false);
    expect(transition(s, submit(q.correctAnswer))).toBe(s);
    const ended = transition(s, { type: 'next', questionId: q.id });
    expect(ended.currentIndex).toBe(1);
    expect(transition(ended, submit(q.correctAnswer))).toBe(ended);
  });
  it.each([0, 1, 2])('locks correct answers after %i incorrect attempts and retains shuffled order', (incorrect) => {
    let s = createSession(questionBank.slice(0, 2));
    const q = s.entries[0].question;
    const originalChoices = [...s.entries[0].choices];
    for (let i = 0; i < incorrect; i++) s = transition(s, { type: 'submit', questionId: q.id, answer: q.distractors[i] });
    s = transition(s, { type: 'submit', questionId: q.id, answer: q.correctAnswer });
    expect(s.entries[0].correct).toBe(true);
    expect(s.entries[0].attempts).toHaveLength(incorrect + 1);
    expect(s.entries[0].choices).toEqual(originalChoices);
    expect(transition(s, { type: 'submit', questionId: q.id, answer: q.correctAnswer })).toBe(s);
    s = transition(s, { type: 'next', questionId: q.id });
    expect(transition(s, { type: 'next', questionId: q.id })).toBe(s);
    expect(transition(s, { type: 'submit', questionId: q.id, answer: q.correctAnswer })).toBe(s);
  });
});
