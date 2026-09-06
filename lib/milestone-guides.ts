import type { Idea, MilestoneGuide } from './model';

const sentence = (value: string) => value.replace(/[.]+$/, '') + '.';

const shellTokenizerGuide: MilestoneGuide = {
  goal: 'By the end of this session, your shell should receive one simple command from standard input and turn it into tokens that the rest of the program can work with.',
  why: 'A shell cannot execute a command until it understands what the user typed. Tokenization is the first bridge between raw input and parsing or process execution.',
  notYet: [
    'Do not handle pipes, redirects, job control, signals, or multiple commands yet.',
    'Do not build a complete parser. A single happy-path command is enough for this milestone.',
  ],
  firstAction:
    'Open the repository, run the current program once, and locate (or create) the smallest input loop that can read one line.',
  steps: [
    {
      id: 'example',
      title: 'Define one input and its expected tokens',
      instruction: 'Write the example down before changing code.',
      hints: [
        'Start with words separated by ordinary spaces.',
        'Use: ls -la /tmp.',
      ],
    },
    {
      id: 'input',
      title: 'Read one line from standard input',
      instruction: 'Keep input handling separate from tokenization.',
      hints: [
        'First prove that the line reaches your program.',
        'Print or inspect the raw line temporarily.',
      ],
    },
    {
      id: 'tokenize',
      title: 'Tokenize the happy-path command',
      instruction:
        'Return a representation the later parser or executor can consume.',
      hints: [
        'Ignore quoting and operators for now.',
        'Split the simple example into command and arguments.',
      ],
    },
    {
      id: 'run',
      title: 'Run the example end to end',
      instruction: 'Compare the actual tokens with the expected tokens.',
      hints: ['Inspect length and ordering, not only the printed text.'],
    },
    {
      id: 'edge',
      title: 'Add one small edge case',
      instruction:
        'Try extra whitespace or empty input without expanding scope.',
      hints: ['Decide explicitly whether empty input produces zero tokens.'],
    },
    {
      id: 'verify',
      title: 'Verify and record what works',
      instruction: 'Keep the smallest repeatable test or command as evidence.',
      hints: [
        'A tiny automated test is ideal; a reproducible command is still useful evidence.',
      ],
    },
  ],
  examples: [
    {
      label: 'Happy path',
      input: 'ls -la /tmp',
      output: '["ls", "-la", "/tmp"]',
    },
    {
      label: 'Scope check',
      input: '   ',
      output: '[]',
      note: 'Choose and document the empty-input behavior.',
    },
  ],
  verification: [
    'one command',
    'a command with arguments',
    'extra whitespace',
    'empty input',
  ],
  evidencePrompt:
    'Describe the token representation, paste the smallest passing test or reproducible command, and note one behavior you deliberately left out of scope.',
};

/**
 * Curated guidance is derived from every project definition and milestone position.
 * Specific milestones can override this shared structure without putting UI logic in
 * the project library or guessing behavior from a Task title.
 */
export function milestoneGuideFor(
  idea: Idea,
  milestoneIndex: number,
): MilestoneGuide {
  if (idea.id === 'shell' && milestoneIndex === 0) return shellTokenizerGuide;

  const milestone = idea.milestones[milestoneIndex];
  const previous = idea.milestones[milestoneIndex - 1];
  const next = idea.milestones[milestoneIndex + 1];
  const architecture = idea.architecture.split(' → ');
  const input = architecture[0] || 'a small controlled input';
  const output = architecture.at(-1) || 'an observable result';
  const foundation = milestoneIndex === 0;
  const closing = milestoneIndex >= idea.milestones.length - 2;

  return {
    goal: `By the end of this session, you should have a small, observable result for “${sentence(milestone).replace(/\.$/, '')}” in ${idea.name}.`,
    why: `${idea.why} In the project flow—${idea.architecture}—this milestone makes one part concrete enough to test and explain.`,
    notYet: [
      next
        ? `Do not move on to “${sentence(next).replace(/\.$/, '')}” yet.`
        : `Do not add the advanced extension yet: ${sentence(idea.advanced).replace(/\.$/, '')}.`,
      foundation
        ? `Do not optimize or generalize before one simple case is clear.`
        : closing
          ? 'Do not hide limitations; record them instead of widening the milestone.'
          : 'Do not redesign the whole project. Change only the component this milestone needs.',
    ],
    firstAction: previous
      ? `Open the evidence from “${previous}”, run its smallest passing example, and identify the one boundary this milestone extends.`
      : `Open the repository and write one concrete ${input} example plus the ${output} you expect before editing code.`,
    steps: [
      {
        id: 'contract',
        title: 'Write the smallest observable contract',
        instruction: `Describe one input, one expected result, and the limit of “${milestone}”.`,
        hints: [
          'Use a case you can run in under a minute.',
          `Anchor it to this project flow: ${idea.architecture}.`,
        ],
      },
      {
        id: 'locate',
        title: 'Locate the narrow implementation boundary',
        instruction:
          'Find the module, function, configuration, or experiment closest to the contract.',
        hints: [
          'Trace from the input until behavior first differs from your expectation.',
          'Change one boundary at a time.',
        ],
      },
      {
        id: 'happy-path',
        title: 'Make one happy-path example work',
        instruction: `Implement only enough to demonstrate “${milestone}” once.`,
        hints: [
          'Prefer an explicit small version over a flexible unfinished abstraction.',
          'Keep temporary logging until the path is visible.',
        ],
      },
      {
        id: 'edge',
        title: 'Add one meaningful boundary case',
        instruction:
          'Choose the easiest failure, empty value, limit, or recovery case that matters here.',
        hints: [
          'State expected failure behavior before running it.',
          'A safe, clear error is a valid result.',
        ],
      },
      {
        id: 'verify',
        title: 'Run the focused verification',
        instruction:
          'Repeat the happy path and boundary case from a clean starting point.',
        hints: [
          'Keep the command or automated test reproducible.',
          'If it fails, reduce the input before changing more code.',
        ],
      },
      {
        id: 'evidence',
        title: 'Record evidence and one limitation',
        instruction:
          'Explain what now works, how you know, and what deliberately remains.',
        hints: [
          'A commit link alone is not enough; include the observed behavior.',
          'Name the next milestone without starting it.',
        ],
      },
    ],
    examples: [
      {
        label: 'Smallest useful case',
        input,
        output,
        note: `Keep the example focused on “${milestone}” rather than the entire ${idea.name}.`,
      },
    ],
    verification: [
      'the smallest happy-path example',
      'one empty, malformed, or boundary input',
      'the previous milestone still works',
      'a repeatable test, command, or measurement',
    ],
    evidencePrompt: `What did you implement for “${milestone}”? Record the observed behavior, the verification that passed, one thing you learned, and a commit or repository link when relevant.`,
  };
}
