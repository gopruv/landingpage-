export const SCORE_CRITERIA = [
  {
    key: "technical_depth",
    label: "Technical depth",
    weight: 0.35,
    description: "How well the student understands architecture, algorithms, and decisions inside their system. Highest weight because it is hardest to fake.",
  },
  {
    key: "communication",
    label: "Communication",
    weight: 0.25,
    description: "How clearly they explain their thinking. Can they make a complex system understandable to someone not inside their head?",
  },
  {
    key: "reproducibility",
    label: "Reproducibility",
    weight: 0.20,
    description: "Could someone else run and understand this project from what they built and documented? A project only they can run is a liability.",
  },
  {
    key: "problem_solving",
    label: "Problem solving",
    weight: 0.20,
    description: "Genuine problem solving versus tutorial following. Did they make real decisions or assemble pieces without understanding why?",
  },
] as const;

export const SCORE_BANDS = [
  { range: "90 – 100", meaning: "Exceptional — reviewer recommended", pass: true },
  { range: "75 – 89",  meaning: "Strong — ready for industry", pass: true },
  { range: "60 – 74",  meaning: "Passed — solid with room to grow", pass: true },
  { range: "40 – 59",  meaning: "Did not pass — partial understanding, specific gaps noted", pass: false },
  { range: "0 – 39",   meaning: "Did not pass — significant gaps in understanding", pass: false },
] as const;

export const PASS_THRESHOLD = 60;

export type CriterionKey = (typeof SCORE_CRITERIA)[number]["key"];

export interface CriterionRating {
  value: number;
  excluded: boolean;
}

export function ratingTo100(value: number): number {
  return Math.round(value * 20);
}

export function computeWeightedTotal(ratings: Record<CriterionKey, CriterionRating>): number {
  let weightedSum = 0;
  let activeWeight = 0;

  for (const c of SCORE_CRITERIA) {
    const r = ratings[c.key];
    if (!r.excluded) {
      activeWeight += c.weight;
      weightedSum += ratingTo100(r.value) * c.weight;
    }
  }

  if (activeWeight === 0) return 0;
  return Math.round(weightedSum / activeWeight);
}
