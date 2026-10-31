import type { ReactionCategory } from '../data/categories';

/** Paths are relative to public/, e.g. structures/q01-reactant.svg.
 * Render future assets with import.meta.env.BASE_URL + path. */
export interface MolecularStructure {
  smiles: string;
  svgPath: string;
  alt: string;
}

export interface ReactionQuestion {
  id: string;
  category: ReactionCategory;
  reactant: MolecularStructure;
  product: MolecularStructure;
  correctAnswer: string;
  distractors: [string, string, string, string, string, string, string];
  explanation: string;
  hint: string;
  stereochemistry?: string;
  source: { problemNumber: number; page: number; document: string };
  review: {
    status: 'prepared' | 'needs-review';
    issues: string[];
    notes: string[];
  };
}
