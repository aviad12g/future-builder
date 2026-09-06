'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ChangeEvent,
} from 'react';
import {
  ArrowRight,
  Check,
  ImagePlus,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Choice, useApp } from './shared';
import {
  answersEquivalent,
  reasons,
  topics,
  type SatChoice,
  type SatPracticeTask,
  type SatQuestionKind,
} from '@/lib/model';

type Draft = {
  kind: SatQuestionKind;
  questionText: string;
  choices: SatChoice[];
  section: 'Math' | 'Reading & Writing';
  topic: string;
  difficulty: string;
  source: string;
  sourceQuestionId: string;
  imageKey: string;
  imageEssential: boolean;
  imageDescription: string;
};

const choice = (index: number, text = ''): SatChoice => ({
  id: String.fromCharCode(65 + index),
  label: String.fromCharCode(65 + index),
  text,
});

function blankDraft(task?: Pick<SatPracticeTask, 'topic' | 'section'>): Draft {
  return {
    kind: 'multiple-choice',
    questionText: '',
    choices: [choice(0), choice(1), choice(2), choice(3)],
    section: task?.section || 'Math',
    topic: task?.topic || 'Algebra',
    difficulty: 'Medium',
    source: '',
    sourceQuestionId: '',
    imageKey: '',
    imageEssential: false,
    imageDescription: '',
  };
}

export function SatPracticeWorkspace({
  task,
  onComplete,
}: {
  task?: Pick<SatPracticeTask, 'topic' | 'section' | 'questionTarget'>;
  onComplete?: (summary: string) => void;
}) {
  const { state, send, notify } = useApp();
  const [sessionId, setSessionId] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stage, setStage] = useState<'question' | 'answers'>('question');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [override, setOverride] = useState<boolean | undefined>();
  const [reason, setReason] = useState(reasons[0]);
  const [explanation, setExplanation] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const session = state.satSessions.find((item) => item.id === sessionId);
  const questions = session?.questions || [];
  const correct = questions.filter((question) => question.correctness).length;
  const incorrect = questions.filter(
    (question) => !question.correctness,
  ).length;
  const target = task?.questionTarget || 10;
  const derived =
    userAnswer && correctAnswer
      ? answersEquivalent(userAnswer, correctAnswer)
      : undefined;
  const correctness = override ?? derived;

  useEffect(() => {
    if (!session || session.completedAt) return;
    const tick = () =>
      setElapsed(
        Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(session.startedAt).getTime()) / 1000,
          ),
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.startedAt, session?.completedAt]);

  const summary = useMemo(() => {
    const accuracy = questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0;
    return `${questions.length} questions attempted · ${correct} correct · ${incorrect} incorrect · ${accuracy}% accuracy · ${questions.filter((question) => question.mistakeId).length} mistakes saved · ${Math.max(1, Math.round((session?.seconds || elapsed) / 60))} minutes`;
  }, [questions, correct, incorrect, session?.seconds, elapsed]);

  async function startSession() {
    const id = crypto.randomUUID();
    try {
      await send({
        type: 'sat.session.start',
        payload: {
          id,
          date: new Date().toISOString().slice(0, 10),
          section: task?.section || 'Math',
          topic: task?.topic || 'Algebra',
        },
      });
      setSessionId(id);
    } catch {}
  }

  async function extract(file: File) {
    setError('');
    setExtracting(true);
    try {
      const form = new FormData();
      form.set('image', file);
      const response = await fetch('/api/sat/extract', {
        method: 'POST',
        body: form,
      });
      const result = (await response.json()) as {
        extracted?: Record<string, unknown>;
        imageKey?: string;
        error?: string;
      };
      if (!response.ok || !result.extracted || !result.imageKey)
        throw new Error(
          result.error || 'The screenshot could not be extracted.',
        );
      const value = result.extracted;
      const rawChoices = Array.isArray(value.choices) ? value.choices : [];
      const extractedChoices = rawChoices.slice(0, 8).map((item, index) => {
        const entry = item as Record<string, unknown>;
        return choice(index, String(entry.text || ''));
      });
      const kind =
        value.kind === 'open-response' ? 'open-response' : 'multiple-choice';
      setDraft({
        kind,
        questionText: String(value.questionText || ''),
        choices:
          kind === 'multiple-choice'
            ? extractedChoices.length >= 2
              ? extractedChoices
              : [choice(0), choice(1)]
            : [],
        section:
          value.section === 'Reading & Writing' ? 'Reading & Writing' : 'Math',
        topic: String(value.topic || task?.topic || 'Algebra'),
        difficulty: ['Easy', 'Medium', 'Hard'].includes(
          String(value.difficulty),
        )
          ? String(value.difficulty)
          : 'Medium',
        source: 'Screenshot import',
        sourceQuestionId: String(value.sourceQuestionId || ''),
        imageKey: result.imageKey,
        imageEssential: value.imageEssential === true,
        imageDescription: String(value.imageDescription || ''),
      });
      setStage('question');
      notify('Question extracted. Review every field before saving.');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The screenshot could not be extracted.',
      );
    } finally {
      setExtracting(false);
      if (input.current) input.current.value = '';
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void extract(file);
  }

  function pasteImage(event: ClipboardEvent<HTMLDivElement>) {
    if (draft || extracting) return;
    const file = Array.from(event.clipboardData.files).find((item) =>
      item.type.startsWith('image/'),
    );
    if (file) {
      event.preventDefault();
      void extract(file);
    }
  }

  function resetQuestion() {
    setDraft(null);
    setStage('question');
    setUserAnswer('');
    setCorrectAnswer('');
    setOverride(undefined);
    setReason(reasons[0]);
    setExplanation('');
    setError('');
  }

  async function saveQuestion() {
    if (!draft || correctness === undefined) return;
    setSaving(true);
    setError('');
    try {
      await send({
        type: 'sat.question.add',
        payload: {
          id: crypto.randomUUID(),
          sessionId,
          ...draft,
          userAnswer,
          correctAnswer,
          correctnessOverride: override,
          reason: correctness ? undefined : reason,
          explanation: correctness ? undefined : explanation,
        },
      });
      notify(
        correctness
          ? 'Correct question saved to this session.'
          : 'Question saved and linked to your Mistake Notebook.',
      );
      resetQuestion();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The question could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function finishSession() {
    setSaving(true);
    try {
      await send({
        type: 'sat.session.finish',
        payload: { id: sessionId, seconds: elapsed },
      });
      notify('SAT practice session saved.');
      onComplete?.(summary);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  if (!session)
    return (
      <section className="task-workspace sat-practice-start">
        <div>
          <span className="workspace-kicker">QUESTION-BASED PRACTICE</span>
          <h2>
            {task
              ? `${task.topic} · ${target} question goal`
              : 'Start a real SAT session'}
          </h2>
          <p>
            Questions, answers, accuracy, and mistakes stay connected. Nothing
            needs to be counted by hand.
          </p>
        </div>
        <button className="primary" onClick={startSession}>
          Start practice session <ArrowRight size={16} />
        </button>
      </section>
    );

  if (session.completedAt)
    return (
      <section className="task-workspace sat-session-complete">
        <span className="workspace-kicker">SESSION COMPLETE</span>
        <h2>
          {questions.length
            ? `${Math.round((correct / questions.length) * 100)}% accuracy`
            : 'A session ready for next time'}
        </h2>
        <p>{summary}</p>
      </section>
    );

  return (
    <section
      aria-label="SAT question practice workspace"
      className="task-workspace sat-session"
      onPaste={pasteImage}
      tabIndex={0}
    >
      <div className="sat-session-header">
        <div>
          <span className="workspace-kicker">LIVE PRACTICE SESSION</span>
          <h2>{session.topic}</h2>
        </div>
        <div className="sat-live-stats">
          <span>
            <strong>{questions.length}</strong> attempted
          </span>
          <span>
            <strong>{correct}</strong> correct
          </span>
          <span>
            <strong>{incorrect}</strong> incorrect
          </span>
          <span>
            <strong>
              {questions.length
                ? Math.round((correct / questions.length) * 100)
                : 0}
              %
            </strong>{' '}
            accuracy
          </span>
        </div>
      </div>
      <Progress value={Math.min(100, (questions.length / target) * 100)} />
      {!draft ? (
        <div className="question-import">
          <ImagePlus size={28} />
          <div>
            <h3>Add the next actual question</h3>
            <p>
              Upload or paste a screenshot. You will always review and edit the
              extraction before it is saved.
            </p>
          </div>
          <input
            ref={input}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={chooseFile}
          />
          <button
            className="primary"
            disabled={extracting}
            onClick={() => input.current?.click()}
          >
            {extracting ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            {extracting
              ? 'Extracting question…'
              : 'Add question from screenshot'}
          </button>
          <button
            className="quiet-button"
            disabled={extracting}
            onClick={() => setDraft(blankDraft(task))}
          >
            <Plus size={16} /> Enter question manually
          </button>
          <small>
            Tip: focus this panel and paste an image from your clipboard.
          </small>
        </div>
      ) : stage === 'question' ? (
        <div className="question-editor">
          <div className="editor-heading">
            <div>
              <span className="workspace-kicker">REVIEW THE EXTRACTION</span>
              <h3>Correct anything the image reader missed.</h3>
            </div>
            <button className="text-button" onClick={resetQuestion}>
              Discard draft
            </button>
          </div>
          {draft.imageKey && (
            <figure className="question-source-image">
              <img
                src={`/api/sat/image?key=${encodeURIComponent(draft.imageKey)}`}
                alt={draft.imageDescription || 'Uploaded SAT question'}
              />
              <figcaption>
                {draft.imageEssential
                  ? 'Keep this image visible: it may contain an essential diagram, graph, chart, or table.'
                  : 'Original screenshot for verification.'}
              </figcaption>
            </figure>
          )}
          <div className="question-editor-grid">
            <label className="field full">
              <span>Question text</span>
              <textarea
                value={draft.questionText}
                maxLength={10000}
                onChange={(event) =>
                  setDraft({ ...draft, questionText: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Question type</span>
              <Choice
                label="Question type"
                value={draft.kind}
                options={['multiple-choice', 'open-response']}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    kind: value as SatQuestionKind,
                    choices:
                      value === 'multiple-choice'
                        ? draft.choices.length >= 2
                          ? draft.choices
                          : [choice(0), choice(1)]
                        : [],
                  })
                }
              />
            </label>
            <label className="field">
              <span>Section</span>
              <Choice
                label="SAT section"
                value={draft.section}
                options={['Math', 'Reading & Writing']}
                onChange={(value) =>
                  setDraft({ ...draft, section: value as Draft['section'] })
                }
              />
            </label>
            <label className="field">
              <span>Topic</span>
              <Choice
                label="SAT topic"
                value={draft.topic}
                options={topics}
                onChange={(value) => setDraft({ ...draft, topic: value })}
              />
            </label>
            <label className="field">
              <span>Difficulty</span>
              <Choice
                label="Difficulty"
                value={draft.difficulty}
                options={['Easy', 'Medium', 'Hard']}
                onChange={(value) => setDraft({ ...draft, difficulty: value })}
              />
            </label>
            <label className="field">
              <span>Source</span>
              <input
                value={draft.source}
                maxLength={500}
                onChange={(event) =>
                  setDraft({ ...draft, source: event.target.value })
                }
                placeholder="Bluebook, question bank, notes…"
              />
            </label>
            <label className="field">
              <span>Source question ID</span>
              <input
                value={draft.sourceQuestionId}
                maxLength={200}
                onChange={(event) =>
                  setDraft({ ...draft, sourceQuestionId: event.target.value })
                }
              />
            </label>
          </div>
          {draft.kind === 'multiple-choice' && (
            <div className="choice-editor">
              <div className="section-title">
                <h3>Answer choices</h3>
                <button
                  className="text-button"
                  disabled={draft.choices.length >= 8}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      choices: [...draft.choices, choice(draft.choices.length)],
                    })
                  }
                >
                  <Plus size={15} />
                  Add choice
                </button>
              </div>
              {draft.choices.map((item, index) => (
                <div key={item.id} className="choice-edit-row">
                  <strong>{item.label}</strong>
                  <input
                    value={item.text}
                    maxLength={2000}
                    aria-label={`Choice ${item.label}`}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        choices: draft.choices.map((current, currentIndex) =>
                          currentIndex === index
                            ? { ...current, text: event.target.value }
                            : current,
                        ),
                      })
                    }
                  />
                  <button
                    className="icon-button"
                    aria-label={`Remove choice ${item.label}`}
                    disabled={draft.choices.length <= 2}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        choices: draft.choices
                          .filter((_, currentIndex) => currentIndex !== index)
                          .map((current, currentIndex) => ({
                            ...current,
                            id: String.fromCharCode(65 + currentIndex),
                            label: String.fromCharCode(65 + currentIndex),
                          })),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            className="primary"
            disabled={
              !draft.questionText.trim() ||
              (draft.kind === 'multiple-choice' &&
                draft.choices.some((item) => !item.text.trim()))
            }
            onClick={() => {
              setStage('answers');
              setError('');
            }}
          >
            Question looks right <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="answer-recorder">
          <span className="workspace-kicker">RECORD THE RESULT</span>
          <h3>{draft.questionText}</h3>
          {draft.imageKey && draft.imageEssential && (
            <img
              className="answer-source-image"
              src={`/api/sat/image?key=${encodeURIComponent(draft.imageKey)}`}
              alt={draft.imageDescription || 'Question diagram'}
            />
          )}
          {draft.kind === 'multiple-choice' ? (
            <div className="answer-columns">
              <fieldset>
                <legend>MY ANSWER</legend>
                {draft.choices.map((item) => (
                  <button
                    type="button"
                    className={
                      userAnswer === item.id
                        ? 'answer-option selected'
                        : 'answer-option'
                    }
                    key={item.id}
                    onClick={() => {
                      setUserAnswer(item.id);
                      setOverride(undefined);
                    }}
                  >
                    <strong>{item.label}</strong>
                    {item.text}
                  </button>
                ))}
              </fieldset>
              <fieldset>
                <legend>CORRECT ANSWER</legend>
                {draft.choices.map((item) => (
                  <button
                    type="button"
                    className={
                      correctAnswer === item.id
                        ? 'answer-option correct selected'
                        : 'answer-option correct'
                    }
                    key={item.id}
                    onClick={() => {
                      setCorrectAnswer(item.id);
                      setOverride(undefined);
                    }}
                  >
                    <strong>{item.label}</strong>
                    {item.text}
                  </button>
                ))}
              </fieldset>
            </div>
          ) : (
            <div className="answer-columns">
              <label className="field">
                <span>MY ANSWER</span>
                <input
                  value={userAnswer}
                  onChange={(event) => {
                    setUserAnswer(event.target.value);
                    setOverride(undefined);
                  }}
                />
              </label>
              <label className="field">
                <span>CORRECT ANSWER</span>
                <input
                  value={correctAnswer}
                  onChange={(event) => {
                    setCorrectAnswer(event.target.value);
                    setOverride(undefined);
                  }}
                />
              </label>
            </div>
          )}
          {derived !== undefined && (
            <div
              className={`grading-result ${correctness ? 'correct' : 'incorrect'}`}
            >
              <strong>{correctness ? 'Correct' : 'Incorrect'}</strong>
              <span>
                {draft.kind === 'open-response'
                  ? 'Formatting can be ambiguous. Override this result if needed.'
                  : 'Compared from the selected choices.'}
              </span>
              <div>
                <button
                  className={correctness ? 'selected' : ''}
                  onClick={() => setOverride(true)}
                >
                  Mark correct
                </button>
                <button
                  className={correctness === false ? 'selected' : ''}
                  onClick={() => setOverride(false)}
                >
                  Mark incorrect
                </button>
              </div>
            </div>
          )}
          {correctness === false && (
            <div className="mistake-followup">
              <span className="workspace-kicker">WHAT GOT IN THE WAY?</span>
              <Choice
                label="Mistake reason"
                value={reason}
                options={reasons}
                onChange={setReason}
              />
              <label className="field">
                <span>Explanation in my own words</span>
                <textarea
                  value={explanation}
                  maxLength={5000}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder="What should future you notice next time?"
                />
              </label>
              <p>
                This question will be linked to the one canonical Mistake
                Notebook and enter the existing FSRS schedule.
              </p>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="inline-actions">
            <button
              className="quiet-button"
              onClick={() => setStage('question')}
            >
              Back to question
            </button>
            <button
              className="primary"
              disabled={
                saving ||
                correctness === undefined ||
                (correctness === false && !explanation.trim())
              }
              onClick={saveQuestion}
            >
              {saving ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Check size={16} />
              )}{' '}
              Save question
            </button>
          </div>
        </div>
      )}
      {error && !draft && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!draft && questions.length > 0 && (
        <div className="sat-finish-row">
          <span>
            {questions.length >= target
              ? 'Question goal reached.'
              : `${target - questions.length} question${target - questions.length === 1 ? '' : 's'} to your goal.`}
          </span>
          <button
            className="quiet-button"
            disabled={saving}
            onClick={finishSession}
          >
            <Check size={16} />
            Finish SAT session
          </button>
        </div>
      )}
    </section>
  );
}
