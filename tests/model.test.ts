import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  blankState,
  applyAction,
  recommendations,
  progress,
  metrics,
  ideas,
  guideForTask,
  mistakesForTask,
  satSessionStats,
  hydrateState,
  answersEquivalent,
  type SatReviewTask,
} from '../lib/model.ts';
import {
  decryptToken,
  encryptToken,
  normalizeAppOrigin,
  pkceChallenge,
  readCookie,
  sameToken,
} from '../lib/oauth.ts';
import { parseSatExtraction } from '../lib/sat-extraction.ts';
import { milestoneGuideFor } from '../lib/milestone-guides.ts';
const now = '2026-09-06T09:00:00.000Z';
const start = () =>
  applyAction(
    blankState(now),
    {
      type: 'journey.start',
      payload: {
        name: 'Test learner',
        goal: 'Understand systems',
        target: 1500,
        project: 'tcp',
      },
    },
    now,
  );
describe('Evidence and saved progress', () => {
  it('starts a clean personal journey with no fabricated achievements', () => {
    const s = start();
    assert.equal(s.sessions.length, 0);
    assert.equal(s.scores.length, 0);
    assert.equal(metrics(s).milestones, 0);
    assert.equal(progress(s.projects[0]), 0);
    assert.equal(s.profile.onboarded, true);
  });
  it('requires prerequisite milestones and evidence before advancing', () => {
    const s = start();
    assert.throws(() =>
      applyAction(s, {
        type: 'milestone.complete',
        payload: { id: s.projects[0].id, index: 2, evidence: 'test' },
      }),
    );
    assert.throws(() =>
      applyAction(s, {
        type: 'milestone.complete',
        payload: { id: s.projects[0].id, index: 0, evidence: '' },
      }),
    );
    const next = applyAction(
      s,
      {
        type: 'milestone.complete',
        payload: {
          id: s.projects[0].id,
          index: 0,
          evidence: 'Documented a request path and verified each component.',
        },
      },
      now,
    );
    assert.equal(progress(next.projects[0]), 13);
    assert.equal(progress(s.projects[0]), 0);
  });
  it('records time independently from project completion and deduplicates retries', () => {
    const s = start(),
      task = recommendations(s)[0];
    const a = {
      type: 'session.finish',
      payload: {
        id: 'attempt-1',
        task,
        seconds: 1920,
        notes: 'Investigated one fragmented message.',
        outcome: 'progress',
        energy: 1,
      },
    };
    const next = applyAction(s, a, now);
    const repeated = applyAction(next, a, now);
    assert.equal(repeated.sessions.length, 1);
    assert.equal(metrics(repeated).minutes, 32);
    assert.equal(progress(repeated.projects[0]), 0);
  });
  it('rejects impossible SAT observations', () => {
    const s = start();
    assert.throws(() =>
      applyAction(s, {
        type: 'score.add',
        payload: {
          date: '2026-09-06',
          source: 'Test',
          math: 801,
          reading: 700,
        },
      }),
    );
    assert.throws(() =>
      applyAction(s, {
        type: 'score.add',
        payload: {
          date: '2026-02-31',
          source: 'Test',
          math: 700,
          reading: 700,
        },
      }),
    );
    assert.throws(() =>
      applyAction(s, {
        type: 'practice.add',
        payload: {
          date: '2026-09-06',
          topic: 'Algebra',
          section: 'Math',
          questions: 5,
          correct: 6,
          minutes: 10,
        },
      }),
    );
    assert.throws(() =>
      applyAction(s, { type: 'profile.update', payload: { target: 1555 } }),
    );
  });
  it('resizes work without creating a catch-up backlog', () => {
    const s = start(),
      minimal = recommendations(s, 0, 5);
    assert.equal(minimal.length, 1);
    assert.equal(minimal[0].minutes, 5);
    const next = applyAction(
      s,
      { type: 'plan.restart', payload: { areas: ['SAT'] } },
      now,
    );
    assert.equal(next.plan.length, 7);
    assert.equal(next.plan[0].date, '2026-09-06');
    assert.equal(next.plan.filter((d) => d.minutes === 0).length, 2);
    assert.equal(next.plan[0].area, 'SAT');
    assert.equal(next.projects[0].milestones.length, 8);
  });
  it('has 24 complete scoped project definitions', () => {
    assert.equal(ideas.length, 24);
    assert.equal(new Set(ideas.map((i) => i.id)).size, 24);
    for (const i of ideas) {
      assert.equal(i.milestones.length, 8);
      assert.ok(i.prerequisites);
      assert.ok(i.architecture);
    }
  });
});
describe('FSRS adaptive review', () => {
  const mistake = () =>
    applyAction(
      start(),
      {
        type: 'mistake.add',
        payload: {
          question: 'Personal practice question',
          source: 'My own notes',
          section: 'Math',
          topic: 'Algebra',
          difficulty: 'Medium',
          answer: '3',
          correct: '4',
          explanation: 'I subtracted instead of adding.',
          reason: 'Calculation',
        },
      },
      now,
    );
  it('creates a new due card without fabricated review history', () => {
    const s = mistake(),
      m = s.mistakes[0];
    assert.equal(m.card?.due, new Date(now).getTime());
    assert.equal(m.card?.reps, 0);
    assert.equal(m.reviews?.length, 0);
  });
  it('persists the whole scheduler state and review history across JSON round trips', () => {
    const s = mistake(),
      id = s.mistakes[0].id;
    const next = applyAction(
      s,
      { type: 'mistake.review', payload: { id, status: 'Mastered' } },
      now,
    );
    const m = next.mistakes[0];
    assert.equal(m.card?.reps, 1);
    assert.equal(m.reviews?.length, 1);
    assert.ok(m.card!.due > new Date(now).getTime());
    const reread = JSON.parse(JSON.stringify(next));
    const reviewed = applyAction(
      reread,
      { type: 'mistake.review', payload: { id, status: 'Review again' } },
      new Date(m.card!.due).toISOString(),
    );
    assert.equal(reviewed.mistakes[0].card?.reps, 2);
    assert.equal(reviewed.mistakes[0].reviews?.length, 2);
  });
  it('does not permanently remove confidently recalled mistakes', () => {
    const s = mistake();
    const reviewed = applyAction(
      s,
      {
        type: 'mistake.review',
        payload: { id: s.mistakes[0].id, status: 'Mastered' },
      },
      '2025-01-01T00:00:00.000Z',
    );
    assert.equal(recommendations(reviewed)[0].area, 'SAT');
  });
});

describe('Task-aware Focus', () => {
  it('provides milestone-specific engineering guidance and keeps evidence explicit', () => {
    const state = applyAction(
      blankState(now),
      {
        type: 'journey.start',
        payload: {
          name: 'Shell learner',
          goal: 'Understand systems',
          target: 1500,
          project: 'shell',
        },
      },
      now,
    );
    const task = recommendations(state, 2, 45, new Date(now).getTime()).find(
      (candidate) => candidate.kind === 'engineering',
    );
    assert.ok(task && task.kind === 'engineering');
    assert.equal(task.milestoneIndex, 0);
    const guide = guideForTask(state, task);
    assert.match(guide!.goal, /standard input.*tokens/i);
    assert.match(guide!.why, /raw input.*process execution/i);
    assert.ok(guide!.notYet?.some((item) => /pipes.*redirects/i.test(item)));
    assert.ok(guide!.firstAction);
    assert.equal(guide!.steps.length, 6);
    assert.deepEqual(guide!.verification, [
      'one command',
      'a command with arguments',
      'extra whitespace',
      'empty input',
    ]);
    assert.match(guide!.evidencePrompt!, /passing test|reproducible command/i);
    for (const idea of ideas) {
      const projectState = applyAction(
        blankState(now),
        {
          type: 'journey.start',
          payload: {
            name: 'Guide fixture',
            goal: 'Build deeply',
            target: 1500,
            project: idea.id,
          },
        },
        now,
      );
      const projectTask = recommendations(
        projectState,
        2,
        45,
        new Date(now).getTime(),
      ).find((candidate) => candidate.kind === 'engineering');
      assert.ok(projectTask && projectTask.kind === 'engineering');
      const projectGuide = guideForTask(projectState, projectTask);
      assert.ok(
        projectGuide?.goal && projectGuide.why && projectGuide.firstAction,
      );
      assert.ok((projectGuide?.steps.length || 0) >= 5);
      assert.ok((projectGuide?.verification.length || 0) >= 3);
      for (let index = 0; index < idea.milestones.length; index++) {
        const milestoneGuide = milestoneGuideFor(idea, index);
        assert.ok(
          milestoneGuide.goal &&
            milestoneGuide.why &&
            milestoneGuide.firstAction,
        );
        assert.ok(milestoneGuide.steps.length >= 5);
        assert.ok(milestoneGuide.verification.length >= 3);
      }
    }
  });

  it('retains the exact deterministic mistake IDs chosen for SAT review', () => {
    let state = start();
    for (let index = 0; index < 5; index++) {
      state = applyAction(
        state,
        {
          type: 'mistake.add',
          payload: {
            question: `Question ${index}`,
            source: `Fixture ${index}`,
            section: 'Math',
            topic: 'Algebra',
            difficulty: 'Medium',
            answer: 'A',
            correct: 'C',
            explanation: 'I skipped a sign.',
            reason: 'Careless error',
          },
        },
        now,
      );
    }
    const expected = state.mistakes
      .map((mistake) => mistake.id)
      .sort()
      .slice(0, 3);
    const task = recommendations(state, 2, 45, new Date(now).getTime())[0];
    assert.equal(task.kind, 'sat-review');
    assert.deepEqual((task as SatReviewTask).mistakeIds, expected);
    assert.deepEqual(
      mistakesForTask(state, task as SatReviewTask).map(
        (mistake) => mistake.id,
      ),
      expected,
    );
  });

  it('assigns exactly one actual mistake in Bare Minimum mode', () => {
    let state = start();
    for (let index = 0; index < 3; index++) {
      state = applyAction(
        state,
        {
          type: 'mistake.add',
          payload: {
            question: `Bare minimum ${index}`,
            source: 'Fixture',
            section: 'Reading & Writing',
            topic: 'Craft & Structure',
            difficulty: 'Hard',
            answer: 'A',
            correct: 'B',
            explanation: 'I missed the transition.',
            reason: 'Misread',
          },
        },
        now,
      );
    }
    const tasks = recommendations(state, 0, 10, new Date(now).getTime());
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].kind, 'sat-review');
    assert.equal((tasks[0] as SatReviewTask).mistakeIds.length, 1);
  });
});

describe('Question-based SAT practice', () => {
  const begin = (id = 'sat-session') =>
    applyAction(
      start(),
      {
        type: 'sat.session.start',
        payload: { id, date: '2026-09-06', section: 'Math', topic: 'Algebra' },
      },
      now,
    );
  const choices = ['A', 'B', 'C', 'D'].map((label) => ({
    id: label,
    label,
    text: `Choice ${label}`,
  }));

  it('saves an incorrect multiple-choice question and links one canonical Mistake', () => {
    const state = applyAction(
      begin(),
      {
        type: 'sat.question.add',
        payload: {
          id: 'question-mc',
          sessionId: 'sat-session',
          kind: 'multiple-choice',
          questionText: 'Which value solves x + 2 = 5?',
          choices,
          userAnswer: 'A',
          correctAnswer: 'C',
          section: 'Math',
          topic: 'Algebra',
          difficulty: 'Easy',
          source: 'Screenshot import',
          sourceQuestionId: 'fixture-mc',
          reason: 'Calculation',
          explanation: 'I subtracted in the wrong direction.',
        },
      },
      now,
    );
    const question = state.satSessions[0].questions[0];
    assert.equal(question.kind, 'multiple-choice');
    assert.equal(question.correctness, false);
    assert.equal(state.mistakes.length, 1);
    assert.equal(question.mistakeId, state.mistakes[0].id);
    assert.equal(state.mistakes[0].satQuestionId, question.id);
    assert.equal(state.mistakes[0].card?.reps, 0);
  });

  it('supports open responses and normalizes safe numeric equivalents', () => {
    assert.equal(answersEquivalent('0.5', '1/2'), true);
    const state = applyAction(
      begin('open-session'),
      {
        type: 'sat.question.add',
        payload: {
          id: 'question-open',
          sessionId: 'open-session',
          kind: 'open-response',
          questionText: 'Enter one half as a number.',
          userAnswer: '0.5',
          correctAnswer: '1/2',
          section: 'Math',
          topic: 'Advanced Math',
          difficulty: 'Easy',
          source: 'Fixture',
        },
      },
      now,
    );
    assert.equal(state.satSessions[0].questions[0].kind, 'open-response');
    assert.equal(state.satSessions[0].questions[0].correctness, true);
    assert.equal(state.mistakes.length, 0);
  });

  it('validates mocked screenshot extraction for multiple choice and open response', () => {
    const multipleChoice = parseSatExtraction({
      kind: 'multiple-choice',
      questionText: 'What is x?',
      choices: [
        { label: 'A', text: '1' },
        { label: 'B', text: '2' },
        { label: 'C', text: '3' },
        { label: 'D', text: '4' },
      ],
      section: 'Math',
      topic: 'Algebra',
      difficulty: 'Medium',
      sourceQuestionId: 'mock-mc',
      imageEssential: false,
      imageDescription: '',
    });
    assert.equal(multipleChoice.kind, 'multiple-choice');
    assert.equal(multipleChoice.choices.length, 4);
    const openResponse = parseSatExtraction({
      kind: 'open-response',
      questionText: 'Enter the value of x.',
      choices: [],
      section: 'Math',
      topic: 'Advanced Math',
      difficulty: 'Hard',
      sourceQuestionId: 'mock-open',
      imageEssential: true,
      imageDescription: 'A coordinate graph needed for the question.',
    });
    assert.equal(openResponse.kind, 'open-response');
    assert.deepEqual(openResponse.choices, []);
    assert.equal(openResponse.imageEssential, true);
    assert.throws(() => parseSatExtraction({ ...multipleChoice, choices: [] }));
  });

  it('keeps correct questions without creating mistakes', () => {
    const state = applyAction(
      begin(),
      {
        type: 'sat.question.add',
        payload: {
          id: 'question-correct',
          sessionId: 'sat-session',
          kind: 'multiple-choice',
          questionText: 'Choose A.',
          choices,
          userAnswer: 'A',
          correctAnswer: 'A',
          section: 'Math',
          topic: 'Algebra',
          difficulty: 'Easy',
        },
      },
      now,
    );
    assert.equal(state.satSessions[0].questions.length, 1);
    assert.equal(state.satSessions[0].questions[0].correctness, true);
    assert.equal(state.mistakes.length, 0);
  });

  it('derives 12/9/3/75% session statistics from questions', () => {
    let state = begin();
    for (let index = 0; index < 12; index++) {
      const isCorrect = index < 9;
      state = applyAction(
        state,
        {
          type: 'sat.question.add',
          payload: {
            id: `stats-${index}`,
            sessionId: 'sat-session',
            kind: 'multiple-choice',
            questionText: `Statistics fixture ${index}`,
            choices,
            userAnswer: isCorrect ? 'A' : 'B',
            correctAnswer: 'A',
            section: 'Math',
            topic: 'Algebra',
            difficulty: 'Medium',
            reason: isCorrect ? undefined : 'Logic',
            explanation: isCorrect
              ? undefined
              : 'I used the wrong relationship.',
          },
        },
        now,
      );
    }
    state = applyAction(
      state,
      {
        type: 'sat.session.finish',
        payload: { id: 'sat-session', seconds: 1320 },
      },
      now,
    );
    assert.deepEqual(satSessionStats(state.satSessions[0]), {
      attempted: 12,
      correct: 9,
      incorrect: 3,
      accuracy: 75,
      mistakes: 3,
      minutes: 22,
    });
  });

  it('connects wrong question → Mistake → recommendation → Focus review → same FSRS card', () => {
    let state = applyAction(
      begin(),
      {
        type: 'sat.question.add',
        payload: {
          id: 'loop-question',
          sessionId: 'sat-session',
          kind: 'multiple-choice',
          questionText: 'Full loop fixture',
          choices,
          userAnswer: 'B',
          correctAnswer: 'D',
          section: 'Math',
          topic: 'Algebra',
          difficulty: 'Medium',
          source: 'Fixture',
          reason: 'Careless error',
          explanation: 'I copied the coefficient incorrectly.',
        },
      },
      now,
    );
    const original = state.mistakes[0];
    const task = recommendations(state, 1, 20, new Date(now).getTime())[0];
    assert.equal(task.kind, 'sat-review');
    assert.deepEqual((task as SatReviewTask).mistakeIds, [original.id]);
    assert.equal(
      mistakesForTask(state, task as SatReviewTask)[0].question,
      'Full loop fixture',
    );
    state = applyAction(
      state,
      {
        type: 'mistake.review',
        payload: { id: original.id, status: 'Still unsure' },
      },
      '2026-09-06T09:00:01.000Z',
    );
    const reviewed = state.mistakes.find(
      (mistake) => mistake.id === original.id,
    )!;
    assert.equal(state.mistakes.length, 1);
    assert.equal(reviewed.card?.reps, 1);
    assert.equal(reviewed.reviews?.length, 1);
    assert.ok(reviewed.card!.due > original.card!.due);
  });

  it('hydrates legacy aggregate practice, old mistakes, and generic saved tasks', () => {
    const legacy = JSON.parse(JSON.stringify(start())) as any;
    legacy.version = 1;
    delete legacy.satSessions;
    legacy.practice.push({
      id: 'old-practice',
      date: '2026-09-01',
      topic: 'Algebra',
      section: 'Math',
      questions: 8,
      correct: 6,
      minutes: 15,
    });
    legacy.sessions.push({
      id: 'old-focus',
      task: {
        id: 'old-task',
        title: 'Old SAT focus',
        why: '',
        minutes: 10,
        area: 'SAT',
        skills: ['Algebra'],
        step: 'Try one.',
      },
      date: now,
      seconds: 600,
      notes: '',
      outcome: 'progress',
      energy: 1,
    });
    const hydrated = hydrateState(legacy);
    assert.equal(hydrated.version, 2);
    assert.deepEqual(hydrated.satSessions, []);
    assert.equal(metrics(hydrated).questions, 8);
    assert.equal(hydrated.sessions.at(-1)?.task.kind, 'sat-practice');
  });
});

describe('GitHub OAuth primitives', () => {
  it('validates the exact application origin and callback cookie', () => {
    const origin = 'https://future-builder.aviadcoh.chatgpt.site';
    assert.equal(
      normalizeAppOrigin(origin, origin + '/api/github/connect'),
      origin,
    );
    assert.throws(() => normalizeAppOrigin(origin + '/wrong'));
    assert.throws(() =>
      normalizeAppOrigin('http://future-builder.aviadcoh.chatgpt.site'),
    );
    assert.throws(() =>
      normalizeAppOrigin(origin, 'https://example.com/api/github/connect'),
    );
    assert.equal(
      readCookie('a=1; fb_oauth_state=hello%2Dworld; b=2', 'fb_oauth_state'),
      'hello-world',
    );
    assert.equal(sameToken('same-state', 'same-state'), true);
    assert.equal(sameToken('same-state', 'other-stat'), false);
  });

  it('creates PKCE challenges and encrypts token round trips', async () => {
    const challenge = await pkceChallenge(
      'a-verifier-with-enough-entropy-for-the-test',
    );
    assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);
    const secret = 'owner-managed-secret-with-at-least-32-characters';
    const encrypted = await encryptToken('github-access-token', secret);
    assert.notEqual(encrypted, 'github-access-token');
    assert.equal(await decryptToken(encrypted, secret), 'github-access-token');
    await assert.rejects(() => decryptToken(encrypted, secret + '-wrong'));
  });
});
