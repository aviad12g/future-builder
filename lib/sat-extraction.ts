import type { SatQuestionKind } from './model';

export type SatExtraction = {
  kind: SatQuestionKind;
  questionText: string;
  choices: Array<{ label: string; text: string }>;
  section: 'Math' | 'Reading & Writing';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  sourceQuestionId: string;
  imageEssential: boolean;
  imageDescription: string;
};

const text = (value: unknown, maximum: number) => {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum)
    throw new Error('The extraction result was incomplete.');
  return value.trim();
};

export function parseSatExtraction(value: unknown): SatExtraction {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('The extraction result was invalid.');
  const input = value as Record<string, unknown>;
  if (input.kind !== 'multiple-choice' && input.kind !== 'open-response')
    throw new Error('The extraction did not identify a question type.');
  if (input.section !== 'Math' && input.section !== 'Reading & Writing')
    throw new Error('The extraction did not identify an SAT section.');
  const difficulty = ['Easy', 'Medium', 'Hard', 'Unknown'].includes(
    String(input.difficulty),
  )
    ? (input.difficulty as SatExtraction['difficulty'])
    : 'Unknown';
  const choices = Array.isArray(input.choices)
    ? input.choices.slice(0, 8).map((choice) => {
        if (!choice || typeof choice !== 'object')
          throw new Error('An extracted answer choice was invalid.');
        const item = choice as Record<string, unknown>;
        return { label: text(item.label, 10), text: text(item.text, 2000) };
      })
    : [];
  if (input.kind === 'multiple-choice' && choices.length < 2)
    throw new Error('The extraction did not find enough answer choices.');
  return {
    kind: input.kind,
    questionText: text(input.questionText, 10000),
    choices: input.kind === 'multiple-choice' ? choices : [],
    section: input.section,
    topic: text(input.topic, 100),
    difficulty,
    sourceQuestionId:
      typeof input.sourceQuestionId === 'string'
        ? input.sourceQuestionId.slice(0, 200).trim()
        : '',
    imageEssential: input.imageEssential === true,
    imageDescription:
      typeof input.imageDescription === 'string'
        ? input.imageDescription.slice(0, 1000).trim()
        : '',
  };
}
