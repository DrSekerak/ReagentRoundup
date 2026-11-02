import { decodeProgress, encodeProgress } from '../src/lib/progress';
import { questions } from '../src/data/questions';

// Share the complete browser validator and authoritative question bank with the server.
export function normalizeProgress(document: unknown): unknown {
  return JSON.parse(encodeProgress(decodeProgress(JSON.stringify(document), questions)));
}
