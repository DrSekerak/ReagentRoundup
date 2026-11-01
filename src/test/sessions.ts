import { questionBank } from '../data/questions';
import { createSession, transition, type PracticeSession } from '../lib/practice';

export function finishFixture(): PracticeSession {
  let session = createSession([questionBank[0], questionBank[1], questionBank[5], questionBank[6]], () => .999);
  for (const [index, correctOn] of [1, 2, 3, null].entries()) {
    const q = session.entries[index].question;
    for (let wrong = 0; wrong < (correctOn === null ? 3 : correctOn - 1); wrong++) {
      session = transition(session, { type: 'submit', questionId: q.id, answer: q.distractors[wrong] });
      if (wrong === 0 && [1, 3].includes(index)) session = transition(session, { type: 'hint', questionId: q.id });
    }
    if (correctOn !== null) session = transition(session, { type: 'submit', questionId: q.id, answer: q.correctAnswer });
    session = transition(session, { type: 'next', questionId: q.id });
  }
  return session;
}
