export const reactionCategories = [
  { id: 'radical-chlorination', label: 'Radical chlorination' },
  { id: 'radical-bromination-br2', label: 'Radical bromination using Br₂' },
  { id: 'radical-bromination-nbs', label: 'Radical bromination using NBS' },
  { id: 'sn1', label: 'SN1 substitution with water or alcohol' },
  { id: 'e1', label: 'E1 elimination with water or alcohol' },
  { id: 'sn2', label: 'SN2 substitution' },
  { id: 'e2-zaitsev', label: 'E2 elimination producing the Zaitsev product' },
  { id: 'e2-hofmann', label: 'E2 elimination producing the Hofmann product' },
  { id: 'alcohol-dehydration', label: 'Dehydration of alcohols' },
  { id: 'alcohol-hbr', label: 'Alcohols to alkyl bromides using HBr' },
  { id: 'alcohol-hcl-zncl2', label: 'Alcohols to alkyl chlorides using HCl/ZnCl₂' },
] as const;

export type ReactionCategory = (typeof reactionCategories)[number]['id'];
