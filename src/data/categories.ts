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
  { id: 'alkoxide-formation', label: 'Formation of alkoxides from alcohols' },
  { id: 'alkene-hx', label: 'Markovnikov addition of HX to an alkene' },
  { id: 'alkene-acid-hydration', label: 'Acid-catalyzed hydration of an alkene' },
  { id: 'oxymercuration', label: 'Oxymercuration-demercuration' },
  { id: 'alkoxymercuration', label: 'Alkoxymercuration-demercuration' },
  { id: 'alkene-halogenation', label: 'Addition of a dihalogen to an alkene' },
  { id: 'halohydrin-formation', label: 'Halohydrin formation' },
  { id: 'alkene-hbr-peroxide', label: 'Anti-Markovnikov addition of HBr with peroxide' },
  { id: 'hydroboration-oxidation', label: 'Hydroboration-oxidation' },
  { id: 'alkene-hydrogenation', label: 'Hydrogenation' },
  { id: 'simmons-smith', label: 'Simmons-Smith cyclopropanation' },
  { id: 'carbene-alpha-elimination', label: 'Carbene addition by alpha elimination' },
  { id: 'carbene-diazomethane', label: 'Carbene addition from diazomethane' },
  { id: 'peracid-epoxidation', label: 'Epoxidation with a peracid' },
  { id: 'epoxide-acid-opening', label: 'Ring-opening of epoxides in H₃O⁺' },
  { id: 'halohydrin-epoxide', label: 'Epoxide formation through a halohydrin' },
  { id: 'epoxidation-hydrolysis', label: 'Epoxidation followed by acid ring-opening' },
  { id: 'syn-dihydroxylation', label: 'Syn dihydroxylation of alkenes' },
  { id: 'alkene-ozonolysis', label: 'Ozonolysis of an alkene' },
  { id: 'alkene-oxidative-cleavage', label: 'Oxidative cleavage with concentrated KMnO₄' },
  { id: 'olefin-metathesis', label: 'Olefin metathesis' },
] as const;

export type ReactionCategory = (typeof reactionCategories)[number]['id'];

export const reactionGroups = [
  {
    id: 'radical-halogenation',
    label: 'Radical Halogenation',
    categories: ['radical-chlorination', 'radical-bromination-br2', 'radical-bromination-nbs'],
  },
  {
    id: 'nucleophilic-substitution',
    label: 'Nucleophilic Substitution',
    categories: ['sn1', 'sn2', 'alcohol-hbr', 'alcohol-hcl-zncl2'],
  },
  {
    id: 'elimination',
    label: 'Elimination',
    categories: ['e1', 'e2-zaitsev', 'e2-hofmann', 'alcohol-dehydration'],
  },
  { id: 'alkoxides', label: 'Formation of alkoxides from alcohols', categories: ['alkoxide-formation'] },
  { id: 'markovnikov-additions', label: 'Markovnikov additions', categories: ['alkene-hx', 'alkene-acid-hydration', 'oxymercuration', 'alkoxymercuration', 'alkene-halogenation', 'halohydrin-formation'] },
  { id: 'anti-markovnikov-additions', label: 'anti-Markovnikov additions', categories: ['alkene-hbr-peroxide', 'hydroboration-oxidation'] },
  { id: 'hydrogenation', label: 'Hydrogenation', categories: ['alkene-hydrogenation'] },
  { id: 'carbene-reactions', label: 'Carbene reactions', categories: ['simmons-smith', 'carbene-alpha-elimination', 'carbene-diazomethane'] },
  { id: 'epoxidation-ring-opening', label: 'Epoxidation & ring opening', categories: ['peracid-epoxidation', 'epoxide-acid-opening', 'halohydrin-epoxide', 'epoxidation-hydrolysis'] },
  { id: 'dihydroxylation-cleavage', label: 'Dihydroxylation & oxidative cleavages', categories: ['syn-dihydroxylation', 'alkene-ozonolysis', 'alkene-oxidative-cleavage'] },
  { id: 'metathesis', label: 'Olefin metathesis', categories: ['olefin-metathesis'] },
] as const satisfies readonly { id: string; label: string; categories: readonly ReactionCategory[] }[];

export type ReactionGroup = (typeof reactionGroups)[number]['id'];

export const alkeneSection = {
  label: 'Alkene Reactions (and Other Unit 4 Reactions)',
  groups: ['alkoxides', 'markovnikov-additions', 'anti-markovnikov-additions', 'hydrogenation', 'carbene-reactions', 'epoxidation-ring-opening', 'dihydroxylation-cleavage', 'metathesis'] as readonly ReactionGroup[],
};
