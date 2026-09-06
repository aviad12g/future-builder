'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  Download,
  ExternalLink,
  Feather,
  FileText,
  GitBranch,
  GitFork,
  GraduationCap,
  Heart,
  Link2,
  LoaderCircle,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Unplug,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  PageHeading,
  Stat,
  Meter,
  Empty,
  Choice,
  External,
  useApp,
  dateLabel,
  Heatmap,
} from './shared';
import { resources, ResourceStrip } from './resources';
import {
  metrics,
  progress,
  recommendations,
  ideas,
  type Snapshot,
  type University,
} from '@/lib/model';
function classify(history: Snapshot[], skill: string) {
  const values = history.filter((s) => s.count > 0).slice(-3);
  if (
    values.length < 3 ||
    new Date(values[2].date).getTime() - new Date(values[0].date).getTime() <
      28 * 86400000
  )
    return 'Collecting evidence';
  const [a, b, c] = values.map((s) => (s.skills[skill] || 0) / s.count);
  if (a < 0.01 && b > a && c > b) return 'Emerging';
  if (b > a && c > b && c - a > 0.03) return 'Growing';
  if (b < a && c < b && a - c > 0.03) return 'Declining';
  return c >= 0.15 ? 'Established' : c < 0.03 ? 'Niche' : 'Stable';
}
export function GithubView() {
  const {
    state: s,
    demo,
    githubConfigured,
    notify,
    refresh,
    revision,
    openForm,
    send,
    navigate,
  } = useApp();
  const [syncing, setSyncing] = useState(false);
  async function sync() {
    if (demo) {
      notify('Start your journey before connecting your own GitHub account.');
      return;
    }
    setSyncing(true);
    try {
      const r = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(data.error || 'Please try again.');
      await refresh();
      notify('Your portfolio is synchronized.');
    } catch (e) {
      notify(
        e instanceof Error ? e.message : 'Could not synchronize GitHub.',
        true,
      );
    } finally {
      setSyncing(false);
    }
  }
  const github = s.github;
  return (
    <>
      <PageHeading
        eyebrow="THE GITHUB PORTFOLIO"
        title="Let your work speak for you."
        subtitle="Make the reasoning, testing, and care behind your code easy to see."
      >
        {github && (
          <button className="primary" disabled={syncing} onClick={sync}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} />
            {syncing ? 'Synchronizing…' : 'Synchronize GitHub'}
          </button>
        )}
      </PageHeading>
      {!github ? (
        <section className="github-connect">
          <div className="github-orbit">
            <GitFork size={55} />
            <span />
            <span />
          </div>
          <div>
            <span className="eyebrow">YOUR CODE. YOUR STORY.</span>
            <h2>
              A home for the things
              <br />
              you’ve <em>figured out.</em>
            </h2>
            <p>
              Connect your public repositories. Bring the commits,
              documentation, and engineering decisions into one thoughtful
              portfolio.
            </p>
            <div className="inline-actions">
              {githubConfigured && !demo ? (
                <a className="primary" href="/api/github/connect">
                  Connect GitHub
                  <ArrowUpRight size={17} />
                </a>
              ) : (
                <button
                  className="primary"
                  onClick={() =>
                    notify(
                      demo
                        ? 'Start your personal journey, then connect GitHub.'
                        : 'GitHub OAuth is implemented but its application credentials still need to be configured. See the setup guide supplied with this app.',
                    )
                  }
                >
                  <GitFork size={17} />
                  Connect GitHub
                </button>
              )}
              <button
                className="quiet-button"
                disabled={syncing}
                onClick={sync}
              >
                Already connected? Sync
              </button>
            </div>
            <small>
              <ShieldCheck size={14} />
              Public repositories only. No repository-write permission.
            </small>
            {!githubConfigured && (
              <span className="connection-status">
                Connection setup pending · your engineering lab works
                independently.
              </span>
            )}
          </div>
        </section>
      ) : (
        <>
          <div className="connected-profile">
            <div className="avatar">{github.login[0]?.toUpperCase()}</div>
            <div>
              <h2>@{github.login}</h2>
              <p>
                Last synchronized {dateLabel(github.synced)} · up to 20 recently
                active owned public repositories
              </p>
            </div>
            <span className="tag mint-text">
              <Check size={13} />
              CONNECTED
            </span>
          </div>
          <div className="repo-grid">
            {github.repos.map((repo) => {
              const checks = Object.values(repo.readiness),
                passed = checks.filter(Boolean).length;
              return (
                <article className="panel repo-card" key={repo.name}>
                  <div className="section-title">
                    <GitFork size={22} />
                    <External href={repo.url}>View repository</External>
                  </div>
                  <h3>{repo.name}</h3>
                  <p>
                    {repo.description ||
                      'Add a meaningful repository description on GitHub.'}
                  </p>
                  <div className="chips">
                    {repo.languages.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                  <Meter
                    value={Math.round((passed / checks.length) * 100)}
                    label="Documentation and repository signals"
                    end={passed + ' / ' + checks.length}
                  />
                  <div className="readiness-checks">
                    {Object.entries(repo.readiness).map(([name, value]) => (
                      <span key={name} className={value ? 'present' : ''}>
                        {value ? <Check size={14} /> : <Plus size={14} />}{' '}
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="repo-metadata">
                    <span>{repo.commits} recent commits sampled</span>
                    <span>{repo.prs} pull requests sampled</span>
                    <span>{repo.issues} open issues + PRs</span>
                    <span>CI: {repo.ci}</span>
                    <span>Release: {repo.release || 'Not available'}</span>
                  </div>
                  <button
                    className="quiet-button"
                    onClick={() =>
                      openForm({
                        title: 'Bring this repository into your lab.',
                        description:
                          'Link it to the project whose milestones describe the actual work.',
                        submit: 'Import repository link',
                        fields: [
                          {
                            name: 'project',
                            label: 'Project',
                            options: s.projects.map((p) => p.name),
                          },
                        ],
                        onSubmit: async (data) => {
                          const p = s.projects.find(
                            (p) => p.name === data.project,
                          );
                          if (!p)
                            throw new Error(
                              'Add a project to the engineering lab first.',
                            );
                          await send({
                            type: 'project.update',
                            payload: { id: p.id, repo: repo.url },
                          });
                          notify('Repository linked to your project.');
                        },
                      })
                    }
                  >
                    <Link2 size={15} />
                    Import into project
                  </button>
                </article>
              );
            })}
          </div>
          <p className="source-note">
            Readiness is a bounded heuristic based on root files, README text,
            and available workflow metadata. Verify each signal manually.
            Languages and dependencies do not establish mastery. Commit and PR
            counts are samples, not lifetime totals.
          </p>
        </>
      )}
      <div className="section-title section-spacing">
        <h2>A portfolio with range</h2>
        <button className="text-button" onClick={() => navigate('engineering')}>
          Explore another track
          <ArrowRight size={15} />
        </button>
      </div>
      <div className="coverage-grid">
        {[
          'Systems',
          'Networking',
          'Distributed systems',
          'Cloud',
          'Security',
          'AI & ML',
          'Data',
          'Scientific computing',
        ].map((track) => {
          const ps = s.projects.filter(
            (p) => ideas.find((i) => i.id === p.ideaId)?.category === track,
          );
          const done = ps.some((p) => progress(p) === 100);
          return (
            <div
              className={done ? 'demonstrated' : ps.length ? 'started' : ''}
              key={track}
            >
              <span>
                {done ? (
                  <CheckCircle2 size={18} />
                ) : ps.length ? (
                  <Sprout size={18} />
                ) : (
                  <Plus size={18} />
                )}
              </span>
              <h3>{track}</h3>
              <small>
                {done
                  ? 'Completed project'
                  : ps.length
                    ? 'Growing through a project'
                    : 'A future direction'}
              </small>
            </div>
          );
        })}
      </div>
      <section className="soft-panel">
        <FileText size={22} />
        <div>
          <h3>Help the next person understand it.</h3>
          <p>
            Every serious repository benefits from a clear README, architecture,
            setup instructions, tests, CI, decisions, and honest limitations.
            Explain benchmarks and security boundaries where they matter.
          </p>
        </div>
      </section>
    </>
  );
}
export function MarketView() {
  const { state: s, demo, send, notify, refresh, navigate } = useApp();
  const [loading, setLoading] = useState(false),
    [query, setQuery] = useState('');
  const history = s.snapshots.filter((x) => x.market === s.profile.market),
    latest = history.at(-1);
  const [selection, setSelection] = useState('Latest');
  const snapshot =
    selection === 'Latest' ? latest : history.find((x) => x.id === selection);
  async function load() {
    if (demo) {
      notify(
        'Start your journey and add job-board sources to collect real hiring signals.',
      );
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/market', { method: 'POST' }),
        data = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(data.error || 'Please try again.');
      await refresh();
      notify(
        'A new market snapshot is saved. Previous snapshots are preserved.',
      );
    } catch (e) {
      notify(
        e instanceof Error ? e.message : 'Could not refresh hiring data.',
        true,
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="THE MARKET RADAR"
        title="A signal. Not a steering wheel."
        subtitle="Let real hiring evidence inform your projects. Keep your curiosity in charge."
      >
        <button className="primary" disabled={loading} onClick={load}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Reading job boards…' : 'Refresh signals'}
        </button>
      </PageHeading>
      <div className="market-intro">
        <div className="radar-visual" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
          <Radar size={42} />
        </div>
        <div>
          <span className="eyebrow">FUNDAMENTALS HAVE A LONG SHELF LIFE.</span>
          <h2>
            Build for a changing world.
            <br />
            <em>Learn things that last.</em>
          </h2>
          <p>
            Entry-level hiring, tracked over time. A skill needs several dated
            observations before it earns a trend label.
          </p>
          <Choice
            label="Target market"
            value={s.profile.market}
            options={['United States', 'Israel', 'Remote', 'Global']}
            onChange={(v) =>
              void send({
                type: 'profile.update',
                payload: { market: v },
              }).catch(() => {})
            }
          />
        </div>
      </div>
      {!snapshot ? (
        <section className="panel">
          <Empty
            title="Real signals begin with real sources."
            text="Add up to eight Greenhouse or Lever company boards in Make it yours. Each refresh saves a dated snapshot of matching internship, junior, and new-grad roles."
            action="Set up market sources"
            onClick={() => navigate('settings')}
          />
        </section>
      ) : (
        <>
          <div className="stats-row">
            <Stat
              label="Matched job postings"
              value={snapshot.count}
              note="After role and location filters"
            />
            <Stat
              label="Saved observations"
              value={history.length}
              note="Previous evidence is retained"
            />
            <Stat
              label="Snapshot date"
              value={dateLabel(snapshot.date)}
              note={s.profile.market}
            />
            <Stat
              label="Source coverage"
              value={snapshot.source.split(',').length}
              note="Configured company boards"
            />
          </div>
          <div className="filter-bar">
            <div className="search-field">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search market skills"
                placeholder="Python, Linux, observability…"
              />
            </div>
            <Choice
              label="Historical snapshot"
              options={['Latest', ...history.map((h) => h.date)]}
              value={selection === 'Latest' ? 'Latest' : snapshot.date}
              onChange={(v) =>
                setSelection(
                  v === 'Latest'
                    ? v
                    : history.find((h) => h.date === v)?.id || 'Latest',
                )
              }
            />
          </div>
          <section className="panel">
            <div className="market-table">
              {Object.entries(snapshot.skills)
                .filter(([skill]) =>
                  skill.toLowerCase().includes(query.toLowerCase()),
                )
                .sort((a, b) => b[1] - a[1])
                .map(([skill, count]) => (
                  <div className="market-row" key={skill}>
                    <strong>{skill}</strong>
                    <Meter
                      value={
                        snapshot.count
                          ? Math.round((count / snapshot.count) * 100)
                          : 0
                      }
                      label=""
                      end={count + ' postings'}
                    />
                    <span
                      className={
                        'trend-badge ' + classify(history, skill).toLowerCase()
                      }
                    >
                      {classify(
                        history.filter((h) => h.date <= snapshot.date),
                        skill,
                      )}
                    </span>
                  </div>
                ))}
            </div>
          </section>
          <details className="panel sampled-roles">
            <summary>Inspect the source sample</summary>
            <p>{snapshot.source}</p>
            {snapshot.roles.map((r, i) => (
              <div className="record-row" key={i}>
                {r}
              </div>
            ))}
          </details>
        </>
      )}
      <section className="soft-panel">
        <Compass size={22} />
        <div>
          <h3>What this radar can tell you</h3>
          <p>
            Counts show skill mentions in the configured boards, not the whole
            market. Titles and locations use explicit keyword filters; review
            the sample for misses. Trends require at least three observations
            spanning four weeks. Refresh weekly; compare a full month before
            changing direction.
          </p>
        </div>
      </section>
      <div className="editorial-columns">
        <div>
          <h3>Keep the foundation.</h3>
          <p>
            Operating systems, algorithms, memory, concurrency, networking, and
            databases remain valuable learning directions even when a posting
            uses broader language.
          </p>
        </div>
        <div>
          <h3>Keep your evidence.</h3>
          <p>
            Every refresh adds a snapshot. A scheduled endpoint is available for
            a configured worker; automatic unattended refresh requires
            deployment setup.
          </p>
        </div>
      </div>
    </>
  );
}
export function UniversityView() {
  const { state: s, send, openForm, notify, start } = useApp();
  function add() {
    openForm({
      title: 'A place you could grow.',
      description:
        'Start with a program you want to understand. Leave unverified requirements blank.',
      submit: 'Add to my university path',
      fields: [
        { name: 'name', label: 'University name' },
        { name: 'program', label: 'Program / major' },
        {
          name: 'url',
          label: 'Official admissions page',
          type: 'url',
          required: false,
        },
        {
          name: 'deadline',
          label: 'Verified application deadline',
          type: 'date',
          required: false,
        },
        {
          name: 'sat',
          label: 'Verified testing expectations',
          required: false,
          placeholder: 'Policy, source, and date checked',
        },
        {
          name: 'aid',
          label: 'Funding / scholarships to investigate',
          type: 'textarea',
          required: false,
          max: 1000,
        },
        {
          name: 'notes',
          label: 'Questions and context',
          type: 'textarea',
          required: false,
          max: 5000,
        },
      ],
      onSubmit: async (p) => {
        await send({ type: 'university.add', payload: p });
        notify('A new possibility on your path.');
      },
    });
  }
  return (
    <>
      <PageHeading
        eyebrow="THE UNIVERSITY PATH"
        title="Make the faraway feel closer."
        subtitle="One verified requirement. One meaningful experience. One considered next step."
      >
        <button className="primary" onClick={add}>
          <Plus size={16} />
          Add a university
        </button>
      </PageHeading>
      <section className="university-banner">
        <div className="eyebrow">A FUTURE WITH ROOM FOR YOU.</div>
        <h2>{s.profile.goal || 'Study engineering in the United States'}</h2>
        <p>
          Preparation you can see. Decisions you can make with better
          information.
        </p>
        <div className="university-banner-line">
          <span>
            <GraduationCap size={18} />
            {s.universities.length} possibilities
          </span>
          <span>
            <CheckCircle2 size={18} />
            {s.universities.reduce(
              (a, u) => a + u.requirements.filter((r) => r.done).length,
              0,
            )}{' '}
            preparation steps recorded
          </span>
        </div>
      </section>
      <div className="university-grid">
        {s.universities.map((u) => (
          <article className="panel university-card" key={u.id}>
            <div className="section-title">
              <span className="project-icon blue">
                <GraduationCap size={23} />
              </span>
              <Choice
                label={u.name + ' application status'}
                value={u.status}
                options={[
                  'Researching',
                  'Preparing',
                  'Ready to submit',
                  'Submitted',
                  'Decision received',
                ]}
                onChange={(status) =>
                  void send({
                    type: 'university.update',
                    payload: { id: u.id, status },
                  }).catch(() => {})
                }
              />
            </div>
            <h3>{u.name}</h3>
            <p>{u.program}</p>
            <div className="deadline">
              <Clock size={15} />
              {u.deadline
                ? 'Recorded deadline · ' + dateLabel(u.deadline)
                : 'Deadline to verify'}
            </div>
            <Meter
              label="Preparation checklist"
              value={Math.round(
                (u.requirements.filter((r) => r.done).length /
                  u.requirements.length) *
                  100,
              )}
            />
            <div className="requirements">
              {u.requirements.map((r, index) => (
                <label className="checkbox-row" key={r.title}>
                  <Checkbox
                    checked={r.done}
                    onCheckedChange={() =>
                      void send({
                        type: 'university.update',
                        payload: { id: u.id, index },
                      }).catch(() => {})
                    }
                  />
                  <span>{r.title}</span>
                </label>
              ))}
            </div>
            <details>
              <summary>Your research notes</summary>
              <p>
                <strong>Testing:</strong>{' '}
                {u.sat || 'Needs official verification.'}
              </p>
              <p>
                <strong>Funding:</strong>{' '}
                {u.aid || 'Needs applicant-specific research.'}
              </p>
              <p>{u.notes}</p>
              <button
                className="text-button"
                onClick={() =>
                  openForm({
                    title: 'Research notes · ' + u.name,
                    description:
                      'Record official sources, dates checked, and outstanding questions.',
                    submit: 'Save research notes',
                    fields: [
                      {
                        name: 'notes',
                        label: 'Research and questions',
                        type: 'textarea',
                        value: u.notes,
                        max: 10000,
                      },
                    ],
                    onSubmit: async (data) =>
                      send({
                        type: 'university.update',
                        payload: { id: u.id, ...data },
                      }),
                  })
                }
              >
                Edit notes
                <FileText size={15} />
              </button>
            </details>
            {u.url && (
              <External href={u.url}>Official admissions source</External>
            )}
          </article>
        ))}
      </div>
      {!s.universities.length && (
        <Empty
          title="Start with one possibility."
          text="Research the program, eligibility, remaining requirements, and total costs. You can add more places when you’re ready."
          action="Add a university to explore"
          onClick={add}
        />
      )}
      <div className="section-title section-spacing">
        <h2>Build a life with interesting evidence.</h2>
        <span className="helper">Depth over collecting certificates.</span>
      </div>
      <div className="opportunity-grid">
        {[
          {
            title: 'Contribute to something you use',
            description:
              'Read one contributing guide, improve documentation, or investigate a small issue with the maintainers.',
            url: 'https://opensource.guide/',
            tag: 'OPEN SOURCE',
          },
          {
            title: 'Build with other people',
            description:
              'Explore a hackathon or a sustained collaboration that fits your skills and time. Verify eligibility first.',
            url: 'https://www.mlh.com/',
            tag: 'COLLABORATION',
          },
          {
            title: 'Help someone understand an idea',
            description:
              'Explore peer tutoring or design a small technical volunteering project for a community you know.',
            url: 'https://schoolhouse.world/sat-bootcamp',
            tag: 'COMMUNITY IMPACT',
          },
        ].map((o) => (
          <article className="panel opportunity-card" key={o.title}>
            <span className="resource-kicker">{o.tag}</span>
            <h3>{o.title}</h3>
            <p>{o.description}</p>
            <External href={o.url}>Explore the opportunity</External>
            <button
              className="text-button"
              onClick={() =>
                start({
                  kind: 'generic',
                  id: 'opportunity:' + o.tag,
                  title: 'Take one step: ' + o.title.toLowerCase(),
                  minutes: 15,
                  area: 'University',
                  skills: ['Sustained contribution'],
                  why: 'Meaningful contribution creates evidence of your interests and care over time.',
                  step: 'Check the requirements. Write down a small, realistic way you could contribute.',
                })
              }
            >
              Make a 15-minute start
              <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>
      <ResourceStrip category="University" />
      <p className="source-note">
        Preparation status is a checklist, not an admission probability. Confirm
        applicant-specific deadlines, testing policy, costs, funding
        eligibility, and transfer rules directly with each university.
        Applications and submissions remain your own decisions.
      </p>
    </>
  );
}
export function JourneyView() {
  const { state: s, navigate } = useApp();
  const [period, setPeriod] = useState('Since the beginning');
  const range =
    period === '1 month'
      ? 30
      : period === '3 months'
        ? 90
        : period === '6 months'
          ? 180
          : 10000;
  const start =
    range === 10000
      ? ''
      : new Date(Date.now() - range * 86400000).toISOString();
  const m = metrics(s, start),
    all = metrics(s),
    cutoff = s.scores.filter((x) => x.date < start.slice(0, 10)).at(-1),
    base = cutoff || s.scores[0],
    latest = s.scores.at(-1);
  const scoreChange =
    latest && base
      ? latest.math + latest.reading - base.math - base.reading
      : 0;
  const completed = s.projects.filter((p) => progress(p) === 100).length;
  const milestones = [
    {
      name: 'Build momentum',
      text: 'Begin, return, and make a little room.',
      done: all.sessions > 0,
      detail: all.days + ' days with recorded focus',
      view: 'today',
    },
    {
      name: 'SAT improvement',
      text: 'Find the patterns behind the questions.',
      done: scoreChange > 0,
      detail: s.scores.length + ' practice tests recorded',
      view: 'sat',
    },
    {
      name: 'Systems fundamentals',
      text: 'Understand the things beneath your code.',
      done: Object.entries(s.skills).some(
        ([k, v]) =>
          ['Linux', 'Processes', 'Memory', 'Concurrency'].includes(k) &&
          v.level >= 3,
      ),
      detail: 'Learn, implement, then explain',
      view: 'skills',
    },
    {
      name: 'Advanced engineering',
      text: 'Make something work. Know why it does.',
      done: completed > 0,
      detail: all.milestones + ' milestones with evidence',
      view: 'engineering',
    },
    {
      name: 'A strong GitHub portfolio',
      text: 'Show the care behind the implementation.',
      done: completed >= 3 && !!s.github,
      detail: completed + ' projects completed',
      view: 'github',
    },
    {
      name: 'Your SAT target',
      text: 'A goal to work toward, at your own pace.',
      done: !!latest && latest.math + latest.reading >= s.profile.target,
      detail: s.profile.target + ' target',
      view: 'sat',
    },
    {
      name: 'A flagship project',
      text: 'Follow one interesting idea deeply.',
      done: s.projects.some(
        (p) =>
          progress(p) === 100 &&
          ideas.find((i) => i.id === p.ideaId)?.difficulty === 'Advanced',
      ),
      detail: 'Build, evaluate, document, and defend',
      view: 'engineering',
    },
    {
      name: 'University applications',
      text: 'Turn preparation into a considered application.',
      done: s.universities.some((u) => u.status === 'Submitted'),
      detail: s.universities.length + ' universities on your path',
      view: 'university',
    },
    {
      name: 'Your next chapter',
      text: 'A future with room to grow.',
      done: false,
      detail: 'You are building toward it.',
      view: 'university',
    },
  ];
  const achievements = [
    {
      name: 'A beginning',
      text: 'Record your first focus session',
      done: all.sessions > 0,
      icon: Sprout,
    },
    {
      name: 'A thoughtful builder',
      text: 'Finish a milestone with evidence',
      done: all.milestones > 0,
      icon: Code2,
    },
    {
      name: 'A hundred questions',
      text: 'Record 100 practice questions',
      done: all.questions >= 100,
      icon: BookOpen,
    },
    {
      name: 'Something finished',
      text: 'Complete a serious project',
      done: completed > 0,
      icon: CheckCircle2,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="LOOK HOW FAR YOU’VE COME"
        title="You’ve been becoming all along."
        subtitle="For the days it feels like nothing has changed. Here is what did."
      >
        <Choice
          label="Journey comparison period"
          value={period}
          onChange={setPeriod}
          options={['Since the beginning', '1 month', '3 months', '6 months']}
        />
      </PageHeading>
      <section className="journey-hero">
        <div>
          <span className="eyebrow">LITTLE BY LITTLE ADDS UP.</span>
          <h2>
            {m.minutes > 0 ? (
              <>
                {(m.minutes / 60).toFixed(1)} hours
                <br />
                <em>invested in you.</em>
              </>
            ) : (
              <>
                A blank page.
                <br />
                <em>A world of possibility.</em>
              </>
            )}
          </h2>
          <p>
            {m.sessions} focus sessions. {m.milestones} engineering milestones.
            <br />
            Your work is here, even when it’s hard to feel it.
          </p>
        </div>
        <div className="journey-ring">
          <svg viewBox="0 0 180 180" aria-hidden="true">
            <circle cx="90" cy="90" r="75" />
            <circle
              cx="90"
              cy="90"
              r="75"
              strokeDasharray={`${(Math.min(all.days, 30) / 30) * 471} 471`}
            />
          </svg>
          <div>
            <strong>{all.days}</strong>
            <span>days of becoming</span>
            <small>Each day stays with you.</small>
          </div>
        </div>
      </section>
      <div className="stats-row">
        <Stat
          label="SAT score change"
          value={
            s.scores.length > 1
              ? (scoreChange >= 0 ? '+' : '') + scoreChange
              : '—'
          }
          note="Change between recorded tests"
        />
        <Stat
          label="Questions completed"
          value={m.questions}
          note="From logged practice sets"
        />
        <Stat
          label="Milestones demonstrated"
          value={m.milestones}
          note="Each has supporting evidence"
        />
        <Stat
          label="Skills demonstrated"
          value={m.skills}
          note="Self-assessed with evidence"
        />
      </div>
      <section className="panel journey-activity">
        <div className="section-title">
          <h2>Every return belongs here.</h2>
          <span className="helper">No streak to lose.</span>
        </div>
        <Heatmap sessions={s.sessions} />
      </section>
      <div className="journey-columns">
        <section>
          <div className="section-title section-spacing">
            <h2>Your future, in chapters.</h2>
          </div>
          <div className="roadmap">
            {milestones.map((m, i) => (
              <button
                className={'roadmap-node ' + (m.done ? 'complete' : '')}
                key={m.name}
                onClick={() => navigate(m.view)}
              >
                <span className="roadmap-marker">
                  {m.done ? (
                    <Check size={16} />
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </span>
                <div>
                  <span className="resource-kicker">
                    CHAPTER {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3>{m.name}</h3>
                  <p>{m.text}</p>
                  <small>{m.detail}</small>
                </div>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </section>
        <aside className="journey-evidence">
          <div className="section-title section-spacing">
            <h2>Small things. Real meaning.</h2>
          </div>
          {achievements.map((a) => (
            <div
              className={'achievement ' + (a.done ? 'earned' : '')}
              key={a.name}
            >
              <a.icon size={24} />
              <div>
                <h3>{a.name}</h3>
                <p>{a.text}</p>
                <small>
                  {a.done
                    ? 'Part of your story'
                    : 'Something to look forward to'}
                </small>
              </div>
            </div>
          ))}
          <div className="evidence-note">
            <span>“</span>
            <p>
              You don’t always feel yourself growing.
              <br />
              That doesn’t mean you aren’t.
            </p>
            <small>COME BACK TO THE EVIDENCE.</small>
          </div>
        </aside>
      </div>
    </>
  );
}
export function ReviewView() {
  const { state: s, send, openForm, notify, start } = useApp();
  const [mode, setMode] = useState('Weekly'),
    [reflection, setReflection] = useState('');
  const days = mode === 'Weekly' ? 7 : 30,
    since = new Date(Date.now() - days * 86400000).toISOString(),
    previous = new Date(Date.now() - 2 * days * 86400000).toISOString();
  const m = metrics(s, since),
    beforeAll = metrics(s, previous),
    before = {
      minutes: beforeAll.minutes - m.minutes,
      questions: beforeAll.questions - m.questions,
      milestones: beforeAll.milestones - m.milestones,
      sessions: beforeAll.sessions - m.sessions,
    };
  const tasks = recommendations(s, 2, 30);
  const priorities =
    tasks.length >= 3
      ? tasks
      : tasks
          .concat([
            {
              kind: 'generic',
              id: 'review-next',
              title: 'Write one engineering note about what you learned',
              area: 'Engineering',
              minutes: 10,
              skills: ['Engineering communication'],
              why: 'A clear explanation is evidence of understanding.',
              step: 'Pick one decision you made. Explain the alternatives and why you chose it.',
            } as (typeof tasks)[0],
          ])
          .slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="PAUSE & REFLECT"
        title="Notice the things that moved."
        subtitle="A little reflection. A realistic next week. Room to breathe."
      >
        <Choice
          label="Review period"
          value={mode}
          options={['Weekly', 'Monthly']}
          onChange={setMode}
        />
      </PageHeading>
      <div className="stats-row">
        <Stat
          label="Focus time"
          value={Math.floor(m.minutes / 60) + 'h ' + (m.minutes % 60) + 'm'}
          note={before.minutes + ' min in the previous period'}
        />
        <Stat
          label="SAT practice"
          value={m.questions}
          note={before.questions + ' questions in the previous period'}
        />
        <Stat
          label="Engineering milestones"
          value={m.milestones}
          note={before.milestones + ' in the previous period'}
        />
        <Stat
          label="Focus sessions"
          value={m.sessions}
          note={before.sessions + ' in the previous period'}
        />
      </div>
      <div className="review-columns">
        <section className="panel">
          <div className="section-title">
            <h2>What did you learn about yourself?</h2>
            <Heart size={19} />
          </div>
          <p className="helper">
            What helped you begin? What took more energy than expected? What’s
            one thing you want to carry forward?
          </p>
          <textarea
            className="reflection-text"
            aria-label="Weekly or monthly reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Something I’m glad I tried…"
            maxLength={10000}
          />
          <button
            className="primary"
            disabled={!reflection.trim()}
            onClick={async () => {
              try {
                await send({
                  type: 'reflection.add',
                  payload: { text: `[${mode} review] ${reflection}` },
                });
                setReflection('');
                notify('Reflection saved. You can return to it anytime.');
              } catch {}
            }}
          >
            Keep this reflection
            <Check size={16} />
          </button>
        </section>
        <section className="panel next-priorities">
          <span className="eyebrow">JUST THREE THINGS FOR NEXT WEEK</span>
          {priorities.map((t, i) => (
            <button key={t.id} onClick={() => start(t)}>
              <span>0{i + 1}</span>
              <div>
                <h3>{t.title}</h3>
                <small>
                  {t.area} · {t.minutes} minutes
                </small>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </section>
      </div>
      <div className="review-summary">
        <div>
          <GitFork size={18} />
          <h3>GitHub</h3>
          <p>
            {s.github
              ? `${s.github.repos.length} repositories in the latest sync. ${s.projects.filter((p) => p.repo).length} linked to your lab.`
              : 'Connect GitHub to bring your repository evidence here.'}
          </p>
        </div>
        <div>
          <GitBranch size={18} />
          <h3>Skills</h3>
          <p>
            {Object.entries(s.skills)
              .filter(([, v]) => v.date >= since)
              .map(([k]) => k)
              .join(', ') || 'New skill evidence will appear as you record it.'}
          </p>
        </div>
        <div>
          <Radar size={18} />
          <h3>Market</h3>
          <p>
            {s.snapshots.filter((x) => x.date >= since).length} new snapshots.
            Compare sustained changes before adjusting a project.
          </p>
        </div>
        <div>
          <GraduationCap size={18} />
          <h3>University preparation</h3>
          <p>
            {s.universities.reduce(
              (a, u) => a + u.requirements.filter((r) => r.done).length,
              0,
            )}{' '}
            preparation steps currently checked across {s.universities.length}{' '}
            universities.
          </p>
        </div>
      </div>
      <div className="section-title section-spacing">
        <h2>The thoughts you saved for later</h2>
        <span className="helper">They waited while you focused.</span>
      </div>
      <div className="record-list">
        {s.captures
          .filter((c) => !c.done)
          .map((c) => (
            <div className="record-row capture-row" key={c.id}>
              <Checkbox
                aria-label={'Resolve ' + c.text}
                checked={c.done}
                onCheckedChange={() =>
                  void send({
                    type: 'capture.done',
                    payload: { id: c.id },
                  }).catch(() => {})
                }
              />
              <div>
                <strong>{c.text.replace(/^\[Resource:[^\]]+\] /, '')}</strong>
                <small>{dateLabel(c.date)}</small>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  start({
                    kind: 'generic',
                    id: 'capture:' + c.id,
                    title: c.text.slice(0, 300),
                    minutes: 10,
                    area: 'Engineering',
                    skills: [],
                    why: 'Give this saved thought ten considered minutes.',
                    step: 'Read the thought. Write one concrete next step or decide it can wait.',
                  })
                }
              >
                Give it 10 minutes
                <ArrowRight size={15} />
              </button>
            </div>
          ))}
      </div>
      {!s.captures.filter((c) => !c.done).length && (
        <p className="helper">
          Your mind can be a little quieter. There’s nothing waiting here.
        </p>
      )}
      <div className="section-title section-spacing">
        <h2>Your recent evidence</h2>
      </div>
      <div className="record-list">
        {s.sessions
          .filter((x) => x.date >= since)
          .slice(-12)
          .reverse()
          .map((x) => (
            <div key={x.id} className="record-row">
              <span className="record-icon">
                <Check size={17} />
              </span>
              <div>
                <strong>{x.task.title}</strong>
                <small>
                  {dateLabel(x.date)} · {x.task.area}
                </small>
                {x.notes && <p>{x.notes}</p>}
              </div>
              <span>{Math.floor(x.seconds / 60)} min</span>
            </div>
          ))}
      </div>
      {s.reflections
        .slice(-3)
        .reverse()
        .map((r, i) => (
          <blockquote className="saved-reflection" key={i}>
            <p>{r.text}</p>
            <footer>{dateLabel(r.date)}</footer>
          </blockquote>
        ))}
    </>
  );
}
export function SettingsView() {
  const {
    state: s,
    send,
    openForm,
    notify,
    demo,
    refresh,
    revision,
  } = useApp();
  const [boards, setBoards] = useState(s.profile.boards);
  const [disconnecting, setDisconnecting] = useState(false);
  function edit() {
    openForm({
      title: 'Make room for your own story.',
      description: 'Your goals can evolve. This space can evolve with them.',
      submit: 'Save my profile',
      fields: [
        { name: 'name', label: 'Your name', value: s.profile.name, max: 60 },
        {
          name: 'avatar',
          label: 'Avatar initials or symbol',
          value: s.profile.avatar,
          max: 3,
        },
        {
          name: 'goal',
          label: 'The future you’re building',
          value: s.profile.goal,
          max: 250,
        },
        {
          name: 'focus',
          label: 'Current focus area',
          options: [
            'Networking',
            'Systems',
            'Cloud',
            'AI & ML',
            'Scientific computing',
            'Security',
            'SAT',
          ],
          value: s.profile.focus,
        },
        {
          name: 'target',
          label: 'SAT target',
          type: 'number',
          value: s.profile.target,
          min: 400,
          max: 1600,
          step: 10,
        },
        {
          name: 'satDate',
          label: 'SAT date',
          type: 'date',
          value: s.profile.satDate,
          required: false,
        },
        {
          name: 'time',
          label: 'Available time today (minutes)',
          type: 'number',
          value: s.profile.time,
          min: 5,
          max: 180,
        },
      ],
      onSubmit: async (p) => send({ type: 'profile.update', payload: p }),
    });
  }
  async function update(key: string, value: unknown) {
    try {
      await send({ type: 'profile.update', payload: { [key]: value } });
    } catch {}
  }
  function exportData() {
    const blob = new Blob(
        [
          JSON.stringify(
            { exported: new Date().toISOString(), example: demo, journey: s },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download =
      'future-builder-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('A copy of your journey is ready to keep.');
  }
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS"
        title="A space that feels like you."
        subtitle="A few thoughtful choices. A place you want to return to."
      />
      <div className="settings-grid">
        <section className="panel">
          <div className="section-title">
            <h2>Your story</h2>
            <button className="text-button" onClick={edit}>
              Edit profile
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="settings-profile">
            <span className="avatar">{s.profile.avatar}</span>
            <div>
              <h3>{s.profile.name || 'Your name belongs here'}</h3>
              <p>{s.profile.goal}</p>
            </div>
          </div>
          <dl className="settings-details">
            <div>
              <dt>Focus</dt>
              <dd>{s.profile.focus}</dd>
            </div>
            <div>
              <dt>SAT goal</dt>
              <dd>{s.profile.target}</dd>
            </div>
            <div>
              <dt>Time today</dt>
              <dd>{s.profile.time} minutes</dd>
            </div>
            <div>
              <dt>Test date</dt>
              <dd>
                {s.profile.satDate ? dateLabel(s.profile.satDate) : 'Not set'}
              </dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <h2>A little atmosphere</h2>
          <div className="theme-options">
            {[
              {
                id: 'dark',
                name: 'Dusk',
                colors: ['#202027', '#c8b8ed', '#e4bca5'],
              },
              {
                id: 'ocean',
                name: 'Blue hour',
                colors: ['#1d2832', '#a6c5d3', '#afbfaa'],
              },
              {
                id: 'light',
                name: 'Daylight',
                colors: ['#f6f3f0', '#a598c7', '#d2a28b'],
              },
            ].map((t) => (
              <button
                aria-pressed={s.profile.theme === t.id}
                className={s.profile.theme === t.id ? 'selected' : ''}
                key={t.id}
                onClick={() => void update('theme', t.id)}
              >
                <span>
                  {t.colors.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                {t.name}
                {s.profile.theme === t.id && <Check size={13} />}
              </button>
            ))}
          </div>
          <label className="setting-row">
            <span>
              Accent color<small>Just a small personal touch.</small>
            </span>
            <Choice
              label="Accent color"
              value={s.profile.accent}
              options={['violet', 'mint', 'peach']}
              onChange={(v) => void update('accent', v)}
            />
          </label>
          {[
            {
              key: 'sounds',
              title: 'A soft completion sound',
              description: 'A small chime when you finish a session.',
            },
            {
              key: 'ambience',
              title: 'Ambient movement',
              description: 'Slow, subtle motion in focus mode.',
            },
            {
              key: 'compact',
              title: 'A more compact workspace',
              description: 'A little less space between sections.',
            },
          ].map((o) => (
            <label className="setting-row" key={o.key}>
              <span>
                {o.title}
                <small>{o.description}</small>
              </span>
              <Switch
                aria-label={o.title}
                checked={!!s.profile[o.key as 'sounds']}
                onCheckedChange={(v) => void update(o.key, v)}
              />
            </label>
          ))}
        </section>
        <section className="panel settings-sources">
          <h2>Your market sources</h2>
          <p className="helper">
            Choose companies you’d actually be interested in. Use one public
            job-board identifier per line, such as greenhouse:company or
            lever:company.
          </p>
          <textarea
            aria-label="Public job board identifiers"
            value={boards}
            onChange={(e) => setBoards(e.target.value)}
            maxLength={1000}
            placeholder={'greenhouse:company\nlever:company'}
          />
          <button
            className="primary"
            onClick={async () => {
              if (
                boards
                  .split(/[\n,]+/)
                  .filter((x) => x.trim())
                  .some(
                    (x) =>
                      !/^(greenhouse|lever):[a-zA-Z0-9_-]{1,80}$/.test(
                        x.trim(),
                      ),
                  )
              ) {
                notify(
                  'Use greenhouse:company or lever:company for each board.',
                  true,
                );
                return;
              }
              await update('boards', boards);
              notify('Market source preferences saved.');
            }}
          >
            Save sources
            <Check size={16} />
          </button>
          <p className="source-note">
            Automatic weekly refresh needs a configured scheduler. Manual
            refresh is available in Market radar. Failed reads never become
            trend data.
          </p>
        </section>
        <section className="panel">
          <h2>Your data stays yours.</h2>
          <p className="helper">
            Personal progress is stored for your signed-in account. Export a
            readable copy of your scores, notes, milestones, and sessions at any
            time.
          </p>
          <button className="quiet-button" onClick={exportData}>
            <Download size={16} />
            Export my journey
          </button>
          <div className="sheet-section">
            <h3>GitHub connection</h3>
            <p>
              {s.github
                ? 'Connected to @' + s.github.login
                : 'No synchronized account yet.'}
            </p>
            {s.github && (
              <button
                className="quiet-button"
                disabled={disconnecting}
                onClick={async () => {
                  if (demo) return;
                  setDisconnecting(true);
                  try {
                    const r = await fetch('/api/github/disconnect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ revision }),
                    });
                    const d = (await r.json()) as { error?: string };
                    if (!r.ok) throw new Error(d.error || 'Please try again.');
                    await refresh();
                    notify(
                      'GitHub disconnected. Your project notes remain here.',
                    );
                  } catch (e) {
                    notify(
                      e instanceof Error ? e.message : 'Could not disconnect.',
                      true,
                    );
                  } finally {
                    setDisconnecting(false);
                  }
                }}
              >
                <Unplug size={16} />
                Disconnect GitHub
              </button>
            )}
            <p className="helper">
              Disconnect removes the stored connection token. You can also
              revoke the app in your GitHub account settings.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
