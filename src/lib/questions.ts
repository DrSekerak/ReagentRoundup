import type { ReactionCategory } from '../data/categories';
import type { ReactionQuestion } from '../types/question';

export function filterQuestions(
  questions: readonly ReactionQuestion[],
  categories: readonly ReactionCategory[],
): ReactionQuestion[] {
  return questions.filter((question) => categories.includes(question.category));
}
