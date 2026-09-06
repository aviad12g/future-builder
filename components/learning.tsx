'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileText,
  GitBranch,
  Lock,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Sprout,
  Target,
  Timer,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  PageHeading,
  Stat,
  Meter,
  Empty,
  Choice,
  External,
  useApp,
  dateLabel,
  type Field,
} from './shared';
import {
  ideas,
  projectScore,
  progress,
  topics,
  reasons,
  branches,
  levels,
  defenseQuestions,
  type Idea,
  type Project,
} from '@/lib/model';
import { ResourceStrip, resources } from './resources';
import { SatPracticeWorkspace } from './sat-practice';
const today = () => new Date().toISOString().slice(0, 10);
export function SatView() {
  const { state: s, send, openForm, notify, start } = useApp();
  const [tab, setTab] = useState('progress'),
    [review, setReview] = useState('Due now');
  const latest = s.scores.at(-1),
    structured = s.satSessions.flatMap((session) => session.questions);
  const total =
      s.practice.reduce((a, p) => a + p.questions, 0) + structured.length,
    correct =
      s.practice.reduce((a, p) => a + p.correct, 0) +
      structured.filter((question) => question.correctness).length;
  const scoreForm = () =>
    openForm({
      title: 'A new point on your SAT journey.',
      description:
        'Record a real practice-test result. Section scores come from your score report.',
      submit: 'Save practice test',
      fields: [
        { name: 'date', label: 'Test date', type: 'date', value: today() },
        {
          name: 'source',
          label: 'Test / source',
          placeholder: 'Bluebook practice test 1',
        },
        {
          name: 'math',
          label: 'Math score',
          type: 'number',
          min: 200,
          max: 800,
          step: 10,
        },
        {
          name: 'reading',
          label: 'Reading & Writing score',
          type: 'number',
          min: 200,
          max: 800,
          step: 10,
        },
      ],
      onSubmit: async (p) => {
        await send({ type: 'score.add', payload: p });
        notify('Your SAT journey has a new point.');
      },
    });
  const practiceForm = (topic?: string) =>
    openForm({
      title: 'Add a legacy practice total.',
      description:
        'Use this only for an older set whose individual questions are not available.',
      submit: 'Save legacy practice',
      fields: [
        { name: 'date', label: 'Practice date', type: 'date', value: today() },
        {
          name: 'section',
          label: 'Section',
          options: ['Math', 'Reading & Writing'],
          value:
            topic && topics.indexOf(topic) >= 4 ? 'Reading & Writing' : 'Math',
        },
        {
          name: 'topic',
          label: 'Topic',
          options: topics,
          value: topic || 'Algebra',
        },
        {
          name: 'questions',
          label: 'Questions attempted',
          type: 'number',
          min: 1,
          max: 1000,
          value: 10,
        },
        {
          name: 'correct',
          label: 'Correct answers',
          type: 'number',
          min: 0,
          max: 1000,
        },
        {
          name: 'minutes',
          label: 'Study minutes',
          type: 'number',
          min: 0,
          max: 600,
          value: 15,
        },
      ],
      onSubmit: async (p) => {
        await send({ type: 'practice.add', payload: p });
        notify('Legacy practice saved. Your topic map has been updated.');
      },
    });
  const mistakeForm = () =>
    openForm({
      title: 'Turn a mistake into a way forward.',
      description:
        'Save enough context to understand the question when you revisit it.',
      submit: 'Save to mistake notebook',
      fields: [
        {
          name: 'question',
          label: 'Question or your summary',
          type: 'textarea',
          max: 5000,
        },
        {
          name: 'source',
          label: 'Source / question ID',
          placeholder: 'Official question ID, page, or link',
        },
        {
          name: 'section',
          label: 'Section',
          options: ['Math', 'Reading & Writing'],
        },
        { name: 'topic', label: 'Topic', options: topics },
        {
          name: 'difficulty',
          label: 'Difficulty',
          options: ['Easy', 'Medium', 'Hard'],
        },
        { name: 'answer', label: 'Your answer' },
        { name: 'correct', label: 'Correct answer' },
        { name: 'reason', label: 'What got in the way?', options: reasons },
        {
          name: 'explanation',
          label: 'Explanation in your own words',
          type: 'textarea',
          max: 5000,
        },
      ],
      onSubmit: async (p) => {
        await send({ type: 'mistake.add', payload: p });
        notify('Saved for a thoughtful second look.');
      },
    });
  return (
    <>
      <PageHeading
        eyebrow="YOUR SAT STUDIO"
        title="Understanding, one question deeper."
        subtitle="A score is a moment. The learning is yours to keep."
      >
        <button className="primary" onClick={() => setTab('practice')}>
          <Plus size={17} />
          Start SAT practice
        </button>
      </PageHeading>
      <div className="stats-row peach-stats">
        <Stat
          label="Latest practice"
          value={latest ? (latest.math + latest.reading).toLocaleString() : '—'}
          note={
            latest
              ? dateLabel(latest.date)
              : 'Your first score will appear here'
          }
        />
        <Stat
          label="Your target"
          value={s.profile.target.toLocaleString()}
          note={
            s.profile.satDate
              ? 'SAT date · ' + dateLabel(s.profile.satDate)
              : 'Set your test date in Make it yours'
          }
        />
        <Stat
          label="Questions explored"
          value={total}
          note={
            s.practice.length +
            s.satSessions.length +
            ' recorded practice sessions'
          }
        />
        <Stat
          label="Recorded accuracy"
          value={total ? Math.round((correct / total) * 100) + '%' : '—'}
          note="Across legacy sets and saved questions"
        />
      </div>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(String(v))}
        className="view-tabs"
      >
        <TabsList variant="line">
          <TabsTrigger value="progress">Your progress</TabsTrigger>
          <TabsTrigger value="practice">Practice room</TabsTrigger>
          <TabsTrigger value="topics">Topic map</TabsTrigger>
          <TabsTrigger value="mistakes">
            Mistake notebook{' '}
            <span className="tab-count">{s.mistakes.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="progress">
          <section className="panel score-chart">
            <div className="section-title">
              <div>
                <h2>A little higher. A little more certain.</h2>
                <p className="helper">
                  Recorded section scores. Your target is a goal, never a
                  predicted result.
                </p>
              </div>
              <button className="quiet-button" onClick={scoreForm}>
                <Plus size={15} />
                Add test score
              </button>
            </div>
            {s.scores.length ? (
              <>
                <div className="chart-legend">
                  <span>
                    <i className="peach" />
                    Total
                  </span>
                  <span>
                    <i className="violet" />
                    Math
                  </span>
                  <span>
                    <i className="mint" />
                    Reading & Writing
                  </span>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={s.scores.map((x) => ({
                        ...x,
                        total: x.math + x.reading,
                        label: dateLabel(x.date),
                      }))}
                      margin={{ left: 0, right: 25, top: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="var(--line)"
                        vertical={false}
                        strokeDasharray="3 5"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: 'var(--soft)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[200, 1600]}
                        tick={{ fill: 'var(--soft)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--popover)',
                          border: '1px solid var(--line)',
                          borderRadius: 10,
                          color: 'var(--foreground)',
                        }}
                      />
                      <Line
                        name="Total"
                        type="monotone"
                        dataKey="total"
                        stroke="var(--peach)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        name="Math"
                        type="monotone"
                        dataKey="math"
                        stroke="var(--lavender)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        name="Reading & Writing"
                        type="monotone"
                        dataKey="reading"
                        stroke="#97cdb3"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <Empty
                title="Your first point is a beginning."
                text="Take an official practice test and bring the results back here."
                action="Record a practice test"
                onClick={scoreForm}
              />
            )}
          </section>
          <div className="section-title section-spacing">
            <h2>Your practice record</h2>
            <button className="text-button" onClick={() => setTab('topics')}>
              Explore topic patterns
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="record-list">
            {s.satSessions
              .slice(-5)
              .reverse()
              .map((session) => (
                <div className="record-row" key={session.id}>
                  <span className="record-icon peach">
                    <BookOpen size={17} />
                  </span>
                  <div>
                    <strong>{session.topic}</strong>
                    <small>
                      {session.section} · {dateLabel(session.date)} ·
                      question-based
                    </small>
                  </div>
                  <span>
                    {
                      session.questions.filter(
                        (question) => question.correctness,
                      ).length
                    }{' '}
                    / {session.questions.length} correct
                  </span>
                  <small>{Math.round(session.seconds / 60)} min</small>
                </div>
              ))}
            {s.practice
              .slice(-5)
              .reverse()
              .map((p) => (
                <div className="record-row" key={p.id}>
                  <span className="record-icon peach">
                    <BookOpen size={17} />
                  </span>
                  <div>
                    <strong>{p.topic}</strong>
                    <small>
                      {p.section} · {dateLabel(p.date)}
                    </small>
                  </div>
                  <span>
                    {p.correct} / {p.questions} correct
                  </span>
                  <small>{p.minutes} min</small>
                </div>
              ))}
          </div>
          <ResourceStrip category="SAT" />
        </TabsContent>
        <TabsContent value="practice">
          <SatPracticeWorkspace />
          <div className="practice-room-intro">
            <div className="eyebrow">
              PRACTICE WITH PEOPLE WHO KNOW THE TEST.
            </div>
            <h2>
              Good questions.
              <br />
              <em>Better understanding.</em>
            </h2>
            <p>
              Choose a source, then add each question above. Incorrect answers
              flow into your Mistake Notebook automatically.
            </p>
          </div>
          <div className="practice-sources">
            {resources
              .filter((r) =>
                ['khan', 'bluebook', 'questionbank', 'gemini'].includes(r.id),
              )
              .map((r) => (
                <article key={r.id} className={'panel tint-' + r.color}>
                  <span className={'resource-mark ' + r.color}>{r.mark}</span>
                  <div className="resource-kicker">{r.provider}</div>
                  <h3>{r.name}</h3>
                  <p>{r.description}</p>
                  <External href={r.url}>Open practice</External>
                  <button
                    className="text-button"
                    onClick={() => practiceForm()}
                  >
                    Add an older aggregate set
                    <Plus size={15} />
                  </button>
                  <small>{r.access}</small>
                </article>
              ))}
          </div>
          <section className="soft-panel">
            <Sparkles size={22} />
            <div>
              <h3>Use the best source for the right job.</h3>
              <p>
                College Board supplies official exam practice. Khan Academy
                offers official SAT preparation. Gemini supplies Princeton
                Review-based practice and AI feedback. Future Builder keeps your
                effort, mistakes, and FSRS review schedule together; it does not
                copy their question banks or predict your SAT score.
              </p>
            </div>
          </section>
          <div className="inline-actions">
            <button className="primary" onClick={mistakeForm}>
              <Plus size={16} />
              Save a legacy mistake
            </button>
            <button className="quiet-button" onClick={scoreForm}>
              Log a scored test
              <ArrowRight size={15} />
            </button>
          </div>
        </TabsContent>
        <TabsContent value="topics">
          <div className="topic-grid">
            {topics.map((topic, i) => {
              const sets = s.practice.filter((p) => p.topic === topic),
                individual = structured.filter(
                  (question) => question.topic === topic,
                ),
                q =
                  sets.reduce((a, p) => a + p.questions, 0) + individual.length,
                c =
                  sets.reduce((a, p) => a + p.correct, 0) +
                  individual.filter((question) => question.correctness).length,
                accuracy = q ? Math.round((c / q) * 100) : 0;
              return (
                <button
                  className="panel topic-card"
                  key={topic}
                  onClick={() => setTab('practice')}
                >
                  <span className="resource-kicker">
                    {i < 4 ? 'Math' : 'Reading & Writing'}
                  </span>
                  <h3>{topic}</h3>
                  <div
                    className={
                      'topic-accuracy ' +
                      (accuracy >= 80
                        ? 'mint-text'
                        : accuracy >= 60
                          ? 'peach-text'
                          : '')
                    }
                  >
                    {q ? accuracy + '%' : '—'}
                    <span>recorded accuracy</span>
                  </div>
                  <Meter
                    value={accuracy}
                    label={q + ' questions'}
                    end={sets.length + individual.length + ' records'}
                  />
                  <span className="card-link">
                    Practice & record
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="source-note">
            Accuracy describes your logged question sets. Difficulty, sample
            size, and repeated questions affect it; it is not an official
            mastery score.
          </p>
        </TabsContent>
        <TabsContent value="mistakes">
          <div className="review-engine-note">
            <Sparkles size={17} />
            <div>
              <strong>Remember more. Review when it matters.</strong>
              <p>
                Powered by open-source FSRS. Review again = missed recall; still
                unsure = recalled with effort; mastered = recalled confidently.
                Every answer stays available for future review.
              </p>
            </div>
            <External href="https://github.com/open-spaced-repetition/ts-fsrs">
              Open-source engine
            </External>
          </div>
          <div className="filter-bar">
            <Choice
              label="Mistake review filter"
              options={['Due now', 'All mistakes', 'Mastered']}
              value={review}
              onChange={setReview}
            />
            <button className="primary" onClick={mistakeForm}>
              <Plus size={16} />
              Save a mistake
            </button>
          </div>
          <div className="mistake-list">
            {s.mistakes
              .filter(
                (m) =>
                  review === 'All mistakes' ||
                  (review === 'Mastered' && m.status === 'Mastered') ||
                  (review === 'Due now' &&
                    (m.card ? m.card.due <= Date.now() : m.due <= today())),
              )
              .map((m) => (
                <article className="panel mistake-card" key={m.id}>
                  <div className="section-title">
                    <div className="chips">
                      <span>{m.topic}</span>
                      <span>{m.reason}</span>
                    </div>
                    <span className="tag">{m.difficulty}</span>
                  </div>
                  <h3>{m.question}</h3>
                  <p className="helper">
                    {m.source} · Your answer: {m.answer}
                  </p>
                  <details>
                    <summary>
                      Try explaining it first. Then reveal the answer.
                    </summary>
                    <p>
                      <strong>Correct answer:</strong> {m.correct}
                    </p>
                    <p>{m.explanation}</p>
                  </details>
                  <div className="review-buttons">
                    {['Review again', 'Still unsure', 'Mastered'].map(
                      (status) => (
                        <button
                          key={status}
                          className={
                            'quiet-button ' +
                            (m.status === status ? 'selected' : '')
                          }
                          onClick={() =>
                            void send({
                              type: 'mistake.review',
                              payload: { id: m.id, status },
                            })
                              .then(() =>
                                notify(
                                  'Review saved. Next review has been scheduled.',
                                ),
                              )
                              .catch(() => {})
                          }
                        >
                          {status === 'Mastered' && <Check size={15} />}{' '}
                          {status}
                        </button>
                      ),
                    )}
                  </div>
                  <small className="helper">
                    Next review ·{' '}
                    {m.card
                      ? new Date(m.card.due).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : dateLabel(m.due)}{' '}
                    · FSRS adaptive scheduling
                  </small>
                </article>
              ))}
          </div>
          {!s.mistakes.filter(
            (m) =>
              review === 'All mistakes' ||
              (review === 'Mastered' && m.status === 'Mastered') ||
              (review === 'Due now' &&
                (m.card ? m.card.due <= Date.now() : m.due <= today())),
          ).length && (
            <Empty
              title={
                s.mistakes.length
                  ? 'A little space to let it settle.'
                  : 'Every mistake can teach you something.'
              }
              text={
                s.mistakes.length
                  ? 'Your saved reviews will return when they’re due. You can explore all mistakes any time.'
                  : 'Keep the question, your reasoning, and the idea you want to remember.'
              }
              action="Save a mistake"
              onClick={mistakeForm}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
export function EngineeringView() {
  const { state: s, send, openForm, notify, start } = useApp();
  const [tab, setTab] = useState('projects'),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('All tracks'),
    [selected, setSelected] = useState<string | null>(null),
    [detailTab, setDetailTab] = useState('milestones');
  const project = s.projects.find((p) => p.id === selected);
  const item = project
    ? ideas.find((i) => i.id === project.ideaId)
    : ideas.find((i) => i.id === selected);
  const filtered = ideas
    .filter(
      (i) =>
        (category === 'All tracks' || i.category === category) &&
        (i.name + ' ' + i.skills.join(' ') + ' ' + i.language)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => projectScore(b, s).total - projectScore(a, s).total);
  function complete(p: Project, index: number) {
    openForm({
      title: 'Put evidence behind the milestone.',
      description: p.milestones[index].title,
      submit: 'Complete milestone',
      fields: [
        {
          name: 'evidence',
          label: 'What did you implement and verify?',
          type: 'textarea',
          max: 3000,
          placeholder:
            'Link a commit or test result. Explain the behavior and what you learned.',
        },
      ],
      onSubmit: async (data) => {
        await send({
          type: 'milestone.complete',
          payload: { ...data, id: p.id, index },
        });
        notify('One milestone closer. Your project has grown.');
      },
    });
  }
  return (
    <>
      <PageHeading
        eyebrow="THE ENGINEERING LAB"
        title="Build something you understand."
        subtitle="A few serious projects. A lot of depth. A portfolio with a point of view."
      >
        <button className="primary" onClick={() => setTab('library')}>
          <Plus size={16} />
          Find your next project
        </button>
      </PageHeading>
      <div className="lab-intro">
        <div>
          <span className="eyebrow">YOUR PORTFOLIO PHILOSOPHY</span>
          <h2>
            Go beneath <em>the surface.</em>
          </h2>
          <p>
            Protocols, memory, failure modes. The interesting part is how it
            works.
          </p>
        </div>
        <div className="lab-count">
          <strong>
            {s.projects.filter((p) => progress(p) === 100).length}
            <span> / 8</span>
          </strong>
          <small>finished, thoughtful projects</small>
        </div>
        <div className="lab-micrograph" aria-hidden="true">
          <Code2 />
          <span />
          <GitBranch />
          <span />
          <CheckCircle2 />
        </div>
      </div>
      <Tabs
        className="view-tabs"
        value={tab}
        onValueChange={(v) => setTab(String(v))}
      >
        <TabsList variant="line">
          <TabsTrigger value="projects">
            On your workbench{' '}
            <span className="tab-count">{s.projects.length}</span>
          </TabsTrigger>
          <TabsTrigger value="library">
            Project library <span className="tab-count">24</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <div className="engineering-grid">
            {s.projects.map((p) => (
              <button
                className="panel project-summary clickable-card"
                key={p.id}
                onClick={() => {
                  setSelected(p.id);
                  setDetailTab('milestones');
                }}
              >
                <div className="section-title">
                  <span className="project-icon">
                    <Code2 size={23} />
                  </span>
                  <span
                    className={
                      'tag ' + (progress(p) === 100 ? 'mint-text' : '')
                    }
                  >
                    {progress(p) === 100 ? 'COMPLETE' : 'IN PROGRESS'}
                  </span>
                </div>
                <h3>{p.name}</h3>
                <p>
                  {p.milestones.find((m) => !m.done)?.title ||
                    'Every milestone has supporting evidence.'}
                </p>
                <div className="chips">
                  {p.skills.map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
                <Meter
                  value={progress(p)}
                  label={
                    p.milestones.filter((m) => m.done).length +
                    ' of ' +
                    p.milestones.length +
                    ' milestones'
                  }
                />
                <div className="card-footer">
                  <span>
                    {p.repo
                      ? 'Repository linked'
                      : 'Your next small piece is waiting'}
                  </span>
                  <ArrowUpRight size={16} />
                </div>
              </button>
            ))}
          </div>
          {!s.projects.length && (
            <Empty
              title="Your workbench is ready."
              text="Choose something that makes you ask, “How does that work?”"
              action="Explore 24 engineering projects"
              onClick={() => setTab('library')}
            />
          )}
        </TabsContent>
        <TabsContent value="library">
          <div className="filter-bar">
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Find an engineering project"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rust, networking, chemistry…"
              />
            </div>
            <Choice
              label="Project track"
              value={category}
              onChange={setCategory}
              options={[
                'All tracks',
                ...Array.from(new Set(ideas.map((i) => i.category))),
              ]}
            />
          </div>
          <div className="engineering-grid">
            {filtered.map((i, index) => {
              const score = projectScore(i, s);
              return (
                <button
                  className={
                    'panel idea-card tint-' +
                    ['violet', 'mint', 'blue', 'peach'][index % 4]
                  }
                  key={i.id}
                  onClick={() => {
                    setSelected(i.id);
                    setDetailTab('milestones');
                  }}
                >
                  <div className="section-title">
                    <span className="resource-kicker">{i.category}</span>
                    <span className="fit-score">
                      {score.total}
                      <small>fit</small>
                    </span>
                  </div>
                  <h3>{i.name}</h3>
                  <p>{i.why}</p>
                  <div className="chips">
                    <span>{i.language}</span>
                    <span>{i.difficulty}</span>
                  </div>
                  <div className="card-footer">
                    <span>{i.weeks} weeks · planning estimate</span>
                    <ArrowUpRight size={17} />
                  </div>
                </button>
              );
            })}
          </div>
          {!filtered.length && (
            <Empty
              title="Try another direction."
              text="Search for a language, project, or technical interest."
            />
          )}
          <p className="source-note">
            Fit is a transparent planning heuristic: depth 25%, market relevance
            25%, diversity 20%, university value 15%, interest 10%, and
            completion 5%. Market relevance stays neutral until hiring data
            exists. University value reflects opportunities to demonstrate
            reasoning, not admission odds.
          </p>
        </TabsContent>
      </Tabs>
      <ResourceStrip category="Systems" />
      <Sheet open={!!item} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="project-sheet">
          {item && (
            <>
              <SheetHeader>
                <div className="eyebrow">
                  {item.category.toUpperCase()} · {item.language}
                </div>
                <SheetTitle>{item.name}</SheetTitle>
                <SheetDescription>{item.why}</SheetDescription>
              </SheetHeader>
              <div className="sheet-body">
                <div className="chips">
                  <span>{item.difficulty}</span>
                  <span>{item.weeks} weeks · estimate</span>
                  {item.skills.map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
                {project ? (
                  <>
                    <Meter
                      value={progress(project)}
                      label="Evidence-backed milestones"
                    />
                    <Tabs
                      value={detailTab}
                      onValueChange={(v) => setDetailTab(String(v))}
                      className="view-tabs"
                    >
                      <TabsList variant="line">
                        <TabsTrigger value="milestones">Milestones</TabsTrigger>
                        <TabsTrigger value="notes">
                          Engineering notes
                        </TabsTrigger>
                        <TabsTrigger value="defense">
                          Defend the design
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="milestones">
                        <div className="milestone-list">
                          {project.milestones.map((m, i) => {
                            const locked = project.milestones
                              .slice(0, i)
                              .some((m) => !m.done);
                            return (
                              <div
                                className={
                                  'milestone ' + (m.done ? 'done' : '')
                                }
                                key={m.title}
                              >
                                <span className="milestone-number">
                                  {m.done ? (
                                    <Check size={17} />
                                  ) : locked ? (
                                    <Lock size={14} />
                                  ) : (
                                    i + 1
                                  )}
                                </span>
                                <div>
                                  <h4>{m.title}</h4>
                                  {m.done ? (
                                    <>
                                      <p>{m.evidence}</p>
                                      <small>
                                        {m.date && dateLabel(m.date)}
                                      </small>
                                    </>
                                  ) : (
                                    !locked && (
                                      <div className="inline-actions">
                                        <button
                                          className="text-button"
                                          onClick={() => {
                                            setSelected(null);
                                            start({
                                              kind: 'engineering',
                                              id: project.id + ':' + i,
                                              projectId: project.id,
                                              milestoneIndex: i,
                                              title: m.title,
                                              why: `Move ${project.name} forward by understanding one concrete behavior.`,
                                              minutes: s.profile.time,
                                              area: 'Engineering',
                                              skills: project.skills,
                                              step: 'Define a small example, implement it, then test the outcome.',
                                            });
                                          }}
                                        >
                                          Focus on this
                                          <ArrowRight size={14} />
                                        </button>
                                        <button
                                          className="text-button"
                                          onClick={() => complete(project, i)}
                                        >
                                          Add completion evidence
                                          <Check size={14} />
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                      <TabsContent value="notes">
                        <p className="guidance">
                          {project.notes ||
                            'Leave future you a map: what you tried, what surprised you, and where to pick up.'}
                        </p>
                        <button
                          className="primary"
                          onClick={() =>
                            openForm({
                              title: 'A note for the engineer you’re becoming.',
                              description:
                                'Capture design decisions, experiments, trade-offs, and the next step.',
                              submit: 'Save engineering notes',
                              fields: [
                                {
                                  name: 'notes',
                                  label: 'Engineering journal',
                                  type: 'textarea',
                                  max: 20000,
                                  value: project.notes,
                                },
                              ],
                              onSubmit: async (data) =>
                                send({
                                  type: 'project.update',
                                  payload: { id: project.id, ...data },
                                }),
                            })
                          }
                        >
                          <FileText size={16} />
                          Edit notes
                        </button>
                        <div className="sheet-section">
                          <h3>Linked repository</h3>
                          {project.repo ? (
                            <External href={project.repo}>
                              {project.repo}
                            </External>
                          ) : (
                            <p>No repository linked yet.</p>
                          )}
                          <button
                            className="quiet-button"
                            onClick={() =>
                              openForm({
                                title: 'Link your work.',
                                description:
                                  'Attach a public GitHub repository. Connect GitHub in Portfolio to synchronize it.',
                                submit: 'Link repository',
                                fields: [
                                  {
                                    name: 'repo',
                                    label: 'GitHub repository URL',
                                    type: 'url',
                                    value: project.repo || '',
                                    placeholder:
                                      'https://github.com/you/your-project',
                                  },
                                ],
                                onSubmit: async (data) =>
                                  send({
                                    type: 'project.update',
                                    payload: { id: project.id, ...data },
                                  }),
                              })
                            }
                          >
                            Link repository
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </TabsContent>
                      <TabsContent value="defense">
                        <p className="helper">
                          Your answers are evidence of your reasoning. Review
                          them honestly; this is not an automated mastery grade.
                        </p>
                        {defenseQuestions.map((q) => (
                          <div className="defense-question" key={q}>
                            <h4>{q}</h4>
                            {project.defense[q] && <p>{project.defense[q]}</p>}
                            <div className="inline-actions">
                              <button
                                className="text-button"
                                onClick={() =>
                                  openForm({
                                    title: q,
                                    description:
                                      'Explain the answer in the context of your actual implementation.',
                                    submit: 'Save my explanation',
                                    fields: [
                                      {
                                        name: 'answer',
                                        label: 'Your reasoning',
                                        type: 'textarea',
                                        max: 5000,
                                        value: project.defense[q] || '',
                                      },
                                    ],
                                    onSubmit: async (data) =>
                                      send({
                                        type: 'defense.save',
                                        payload: {
                                          id: project.id,
                                          question: q,
                                          ...data,
                                        },
                                      }),
                                  })
                                }
                              >
                                {project.defense[q]
                                  ? 'Refine my answer'
                                  : 'Explain my thinking'}
                                <MessageCircle size={15} />
                              </button>
                              <button
                                className="text-button"
                                onClick={() =>
                                  void send({
                                    type: 'capture.add',
                                    payload: {
                                      text: `[Learning gap] ${project.name}: ${q}`,
                                    },
                                  })
                                    .then(() =>
                                      notify(
                                        'Saved as a learning task in your reflections.',
                                      ),
                                    )
                                    .catch(() => {})
                                }
                              >
                                Turn into a learning task
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <>
                    <div className="sheet-section">
                      <h3>Prerequisites</h3>
                      <p>{item.prerequisites}</p>
                    </div>
                    <div className="sheet-section">
                      <h3>The architecture</h3>
                      <div className="architecture-flow">
                        {item.architecture.split(' → ').map((x, i) => (
                          <span key={x}>
                            {i > 0 && <ArrowRight size={15} />}
                            <b>{x}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="sheet-section">
                      <h3>Your smallest useful version</h3>
                      <p>{item.milestones.slice(0, 3).join('. ')}.</p>
                    </div>
                    <div className="sheet-section">
                      <h3>When you’re ready to go deeper</h3>
                      <p>{item.advanced}</p>
                    </div>
                    <div className="sheet-section">
                      <h3>The milestones</h3>
                      <ol className="idea-milestones">
                        {item.milestones.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="sheet-section">
                      <h3>Why it fits your portfolio</h3>
                      {Object.entries(projectScore(item, s))
                        .filter(([k]) => !['total', 'hasMarket'].includes(k))
                        .map(([k, v]) => (
                          <Meter
                            key={k}
                            label={
                              k === 'market' && !projectScore(item, s).hasMarket
                                ? 'Market · neutral until data exists'
                                : k[0].toUpperCase() + k.slice(1)
                            }
                            value={Number(v)}
                          />
                        ))}
                      <p className="helper">
                        Technical depth is an editorial estimate. Diversity
                        compares the skills your current projects cover.
                        Completed, explained work matters more than the number.
                      </p>
                    </div>
                    <button
                      disabled={s.projects.some((p) => p.ideaId === item.id)}
                      className="primary"
                      onClick={async () => {
                        try {
                          await send({
                            type: 'project.add',
                            payload: { ideaId: item.id },
                          });
                          setSelected(null);
                          setTab('projects');
                          notify(
                            'A new project on your workbench. Start with milestone one.',
                          );
                        } catch {}
                      }}
                    >
                      <Plus size={17} />
                      {s.projects.some((p) => p.ideaId === item.id)
                        ? 'Already on your workbench'
                        : 'Add to my workbench'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
export function SkillsView() {
  const { state: s, send, openForm, notify } = useApp();
  const colors = ['violet', 'mint', 'blue', 'peach', 'rose', 'blue'];
  const count = Object.values(s.skills).filter((x) => x.level > 0).length;
  function inspect(name: string) {
    openForm({
      title: name + ' · make your understanding visible.',
      description:
        'Choose the stage that your own implementation and explanation support.',
      submit: 'Save skill evidence',
      fields: [
        {
          name: 'level',
          label: 'Current stage',
          options: levels,
          value: levels[s.skills[name]?.level || 0],
        },
        {
          name: 'evidence',
          label: 'What can you explain or demonstrate?',
          type: 'textarea',
          max: 3000,
          value: s.skills[name]?.evidence || '',
          placeholder:
            'A project, a test, an engineering note, or an explanation with a concrete example.',
        },
      ],
      onSubmit: async (p) => {
        await send({
          type: 'skill.update',
          payload: {
            name,
            level: levels.indexOf(String(p.level)),
            evidence: p.evidence,
          },
        });
        notify('A little more of your constellation is taking shape.');
      },
    });
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR SKILL CONSTELLATION"
        title="Watch your understanding connect."
        subtitle="The interesting things happen between the things you learn."
      />
      <section className="constellation">
        <div className="constellation-core">
          <div className="core-orbit" />
          <span>
            <Code2 size={31} />
          </span>
          <h2>Computer science</h2>
          <p>{count} growing skills · connected by what you build</p>
        </div>
        <div className="skill-branches">
          {Object.entries(branches).map(([branch, skills], i) => (
            <section className={'skill-branch ' + colors[i]} key={branch}>
              <div className="branch-stem" />
              <h3>
                <span className="area-dot" />
                {branch}
              </h3>
              {skills.map((skill) => {
                const level = s.skills[skill]?.level || 0;
                return (
                  <button
                    key={skill}
                    className={'skill-node ' + (level ? 'growing' : '')}
                    onClick={() => inspect(skill)}
                  >
                    <span className="skill-node-icon">
                      {level >= 4 ? (
                        <Check size={15} />
                      ) : level ? (
                        <Sprout size={15} />
                      ) : (
                        <Plus size={13} />
                      )}
                    </span>
                    <div>
                      <strong>{skill}</strong>
                      <small>{levels[level]}</small>
                    </div>
                    <div className="skill-pips" aria-label={levels[level]}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <i key={n} className={level >= n ? 'filled' : ''} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      </section>
      <div className="skill-legend">
        {levels.map((l, i) => (
          <span key={l}>
            <i style={{ opacity: 0.25 + i * 0.15 }} />
            {l}
          </span>
        ))}
      </div>
      <section className="soft-panel">
        <Sparkles size={20} />
        <div>
          <h3>Evidence gives the stars their light.</h3>
          <p>
            Using a library starts a conversation. Explaining, implementing,
            testing, and defending the idea is how you show depth.
          </p>
        </div>
      </section>
    </>
  );
}
