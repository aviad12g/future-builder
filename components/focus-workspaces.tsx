'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Lightbulb,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  answersEquivalent,
  guideForTask,
  mistakesForTask,
  type EngineeringTask,
  type SatReviewTask,
} from '@/lib/model';
import { useApp } from './shared';

export function EngineeringFocusWorkspace({
  task,
  onCheckpointChange,
}: {
  task: EngineeringTask;
  onCheckpointChange?: (index: number) => void;
}) {
  const { state } = useApp();
  const guide = guideForTask(state, task);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [hints, setHints] = useState<Record<string, number>>({});
  if (!guide)
    return (
      <p className="guidance">
        Open the project and define one small input and expected output.
      </p>
    );
  const currentIndex = Math.max(
    0,
    guide.steps.findIndex((step) => !done.has(step.id)),
  );
  const current = guide.steps[currentIndex] || guide.steps.at(-1)!;
  const visibleHints = hints[current.id] || 0;
  const toggle = (id: string, checked: boolean) => {
    const next = new Set(done);
    if (checked) next.add(id);
    else next.delete(id);
    setDone(next);
    const index = Math.max(
      0,
      guide.steps.findIndex((step) => !next.has(step.id)),
    );
    onCheckpointChange?.(index < 0 ? guide.steps.length - 1 : index);
  };
  return (
    <section className="task-workspace engineering-focus">
      <div className="focus-brief-grid">
        <article>
          <span className="workspace-kicker">GOAL FOR THIS SESSION</span>
          <h2>{guide.goal}</h2>
        </article>
        <article>
          <span className="workspace-kicker">WHY THIS MATTERS</span>
          <p>{guide.why}</p>
        </article>
        <article className="not-yet">
          <span className="workspace-kicker">NOT YET · OUT OF SCOPE</span>
          <ul>
            {guide.notYet?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="start-here">
          <span className="workspace-kicker">START HERE</span>
          <p>{guide.firstAction}</p>
        </article>
      </div>
      <div className="checkpoint-heading">
        <div>
          <span className="workspace-kicker">GUIDED CHECKPOINTS</span>
          <h2>
            {done.size} / {guide.steps.length} steps
          </h2>
        </div>
        <Progress value={(done.size / guide.steps.length) * 100} />
      </div>
      <div className="checkpoint-list">
        {guide.steps.map((step, index) => (
          <label
            className={`checkpoint ${current.id === step.id ? 'current' : ''} ${done.has(step.id) ? 'done' : ''}`}
            key={step.id}
          >
            <Checkbox
              checked={done.has(step.id)}
              onCheckedChange={(checked) => toggle(step.id, checked === true)}
            />
            <span>
              <small>STEP {index + 1}</small>
              <strong>{step.title}</strong>
              {step.instruction && <p>{step.instruction}</p>}
            </span>
          </label>
        ))}
      </div>
      <div className="checkpoint-coach">
        <Lightbulb size={20} />
        <div>
          <span className="workspace-kicker">CURRENT CHECKPOINT</span>
          <h3>{current.title}</h3>
          <p>{current.instruction}</p>
          {current.hints?.slice(0, visibleHints).map((hint, index) => (
            <p className="progressive-hint" key={hint}>
              <strong>Hint {index + 1}.</strong> {hint}
            </p>
          ))}
          {visibleHints < (current.hints?.length || 0) && (
            <button
              className="text-button"
              onClick={() =>
                setHints({ ...hints, [current.id]: visibleHints + 1 })
              }
            >
              Show {visibleHints ? 'a stronger' : 'one'} hint{' '}
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
      {!!guide.examples?.length && (
        <div className="focus-examples">
          <span className="workspace-kicker">SMALL EXAMPLES</span>
          {guide.examples.map((example, index) => (
            <article key={index}>
              <strong>{example.label || `Example ${index + 1}`}</strong>
              {example.input && (
                <p>
                  <span>Input</span>
                  <code>{example.input}</code>
                </p>
              )}
              {example.output && (
                <p>
                  <span>Expected</span>
                  <code>{example.output}</code>
                </p>
              )}
              {example.note && <small>{example.note}</small>}
            </article>
          ))}
        </div>
      )}
      <div className="verification-panel">
        <Target size={20} />
        <div>
          <span className="workspace-kicker">VERIFY BEFORE COMPLETING</span>
          <ul>
            {guide.verification.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="evidence-prompt">
        <ShieldCheck size={20} />
        <div>
          <span className="workspace-kicker">EVIDENCE</span>
          <p>{guide.evidencePrompt}</p>
          <small>
            The timer ending will not complete this milestone. Add concrete
            evidence when the work is ready.
          </small>
        </div>
      </div>
    </section>
  );
}

export function SatReviewFocusWorkspace({
  task,
  onComplete,
}: {
  task: SatReviewTask;
  onComplete?: (summary: string) => void;
}) {
  const { state, send, notify } = useApp();
  const mistakes = useMemo(() => mistakesForTask(state, task), [state, task]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [completeSummary, setCompleteSummary] = useState('');
  const mistake = mistakes[index];
  if (completeSummary)
    return (
      <section className="task-workspace sat-session-complete">
        <span className="workspace-kicker">SAT REVIEW COMPLETE</span>
        <h2>{mistakes.length} mistakes revisited</h2>
        <p>{completeSummary}</p>
        <small>
          Use Finish session below to review the evidence note and save your
          focused time.
        </small>
      </section>
    );
  if (!mistake)
    return (
      <section className="task-workspace">
        <h2>SAT review unavailable</h2>
        <p>
          The assigned mistake is no longer in your notebook. Return to Today
          for a fresh recommendation.
        </p>
      </section>
    );
  const correct = submitted
    ? answersEquivalent(answer, mistake.correct)
    : false;
  const image = mistake.imageKey
    ? `/api/sat/image?key=${encodeURIComponent(mistake.imageKey)}`
    : '';

  async function rate(status: 'Review again' | 'Still unsure' | 'Mastered') {
    setSaving(true);
    try {
      await send({
        type: 'mistake.review',
        payload: { id: mistake.id, status },
      });
      const nextCorrect = correctCount + Number(correct);
      const nextMastered = masteredCount + Number(status === 'Mastered');
      setCorrectCount(nextCorrect);
      setMasteredCount(nextMastered);
      if (index + 1 < mistakes.length) {
        setIndex(index + 1);
        setAnswer('');
        setSubmitted(false);
        notify(`Review saved. Question ${index + 2} is ready.`);
      } else {
        const summary = `${mistakes.length} mistakes revisited · ${nextCorrect} answered correctly this time · ${mistakes.length - nextCorrect} still need work · ${nextMastered} marked Mastered`;
        setCompleteSummary(summary);
        notify('SAT review set complete.');
        onComplete?.(summary);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="task-workspace sat-review-focus">
      <div className="review-progress">
        <div>
          <span className="workspace-kicker">SAT REVIEW</span>
          <h2>
            Mistake {index + 1} of {mistakes.length}
          </h2>
        </div>
        <Progress value={(index / mistakes.length) * 100} />
      </div>
      <article className="active-recall-card">
        <div className="chips">
          <span>{mistake.section}</span>
          <span>{mistake.topic}</span>
          <span>{mistake.difficulty}</span>
        </div>
        {image && (
          <figure className="question-source-image">
            <img
              src={image}
              alt={mistake.imageDescription || 'Saved SAT question image'}
            />
            <figcaption>
              {mistake.imageEssential
                ? 'The saved image is part of the question.'
                : 'Original saved question.'}
            </figcaption>
          </figure>
        )}
        <h3>{mistake.question}</h3>
        {!submitted ? (
          <>
            <p className="active-recall-note">
              Answer from memory first. Your old answer and explanation stay
              hidden until you submit.
            </p>
            {mistake.questionKind === 'multiple-choice' &&
            mistake.choices?.length ? (
              <div className="review-answer-options">
                {mistake.choices.map((choice) => (
                  <button
                    key={choice.id}
                    className={
                      answer === choice.id
                        ? 'answer-option selected'
                        : 'answer-option'
                    }
                    onClick={() => setAnswer(choice.id)}
                  >
                    <strong>{choice.label}</strong>
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : (
              <label className="field">
                <span>MY NEW REVIEW ANSWER</span>
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                />
              </label>
            )}
            <button
              className="primary"
              disabled={!answer.trim()}
              onClick={() => setSubmitted(true)}
            >
              Submit review attempt <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div
              className={`review-result ${correct ? 'correct' : 'incorrect'}`}
            >
              <strong>{correct ? 'Correct this time' : 'Not yet'}</strong>
              <p>
                <span>My new answer</span>
                {answer}
              </p>
              <p>
                <span>My old answer</span>
                {mistake.answer}
              </p>
              <p>
                <span>Correct answer</span>
                {mistake.correct}
              </p>
            </div>
            <div className="saved-explanation">
              <span className="workspace-kicker">
                WHY I MISSED IT BEFORE · {mistake.reason.toUpperCase()}
              </span>
              <p>{mistake.explanation}</p>
            </div>
            <div className="fsrs-rating">
              <span className="workspace-kicker">HOW DID RECALL FEEL?</span>
              <p>
                This updates the same FSRS card and review history used by
                Mistake Notebook.
              </p>
              <div>
                {(['Review again', 'Still unsure', 'Mastered'] as const).map(
                  (status) => (
                    <button
                      className="quiet-button"
                      disabled={saving}
                      key={status}
                      onClick={() => rate(status)}
                    >
                      {status === 'Mastered' && <Check size={15} />}
                      {status}
                    </button>
                  ),
                )}
              </div>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
