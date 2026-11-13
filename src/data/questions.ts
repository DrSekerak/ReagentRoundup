import type { ReactionQuestion } from '../types/question';
import bank from './question-bank.json';
import unit4Bank from './unit4-question-bank.json';

// Runtime validation runs in CI; both source sets remain available for review.
// "prepared" means transcribed and checked, not instructor-approved.
// JSON widens strings and tuple lengths; validate:questions checks this boundary.
export const questionBank = [...bank, ...unit4Bank] as unknown as readonly ReactionQuestion[];
export const questions = questionBank.filter(({ review }) => review.status === 'prepared');
