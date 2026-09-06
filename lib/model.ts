import {
  initialCard,
  nextReview,
  type StoredCard,
  type StoredReview,
} from './spaced-review.ts';
import { milestoneGuideFor } from './milestone-guides.ts';
export type Energy = 0 | 1 | 2 | 3;
export type Area = 'Engineering' | 'SAT' | 'University' | 'Recovery';
export type MilestoneGuide = {
  goal: string;
  why: string;
  notYet?: string[];
  firstAction: string;
  steps: Array<{
    id: string;
    title: string;
    instruction?: string;
    hints?: string[];
  }>;
  examples?: Array<{
    label?: string;
    input?: string;
    output?: string;
    note?: string;
  }>;
  verification: string[];
  evidencePrompt?: string;
};
type TaskBase = {
  id: string;
  title: string;
  why: string;
  minutes: number;
  area: Area;
  skills: string[];
  step: string;
};
export type EngineeringTask = TaskBase & {
  kind: 'engineering';
  area: 'Engineering';
  projectId: string;
  milestoneIndex: number;
};
export type SatReviewTask = TaskBase & {
  kind: 'sat-review';
  area: 'SAT';
  mistakeIds: string[];
};
export type SatPracticeTask = TaskBase & {
  kind: 'sat-practice';
  area: 'SAT';
  topic: string;
  section: 'Math' | 'Reading & Writing';
  questionTarget: number;
};
export type UniversityTask = TaskBase & {
  kind: 'university';
  area: 'University';
  universityId: string;
};
export type GenericTask = TaskBase & {
  kind: 'generic' | 'recovery';
  projectId?: string;
};
export type Task =
  | EngineeringTask
  | SatReviewTask
  | SatPracticeTask
  | UniversityTask
  | GenericTask;
export type Session = {
  id: string;
  task: Task;
  date: string;
  seconds: number;
  notes: string;
  outcome: 'progress' | 'completed' | 'rest';
  energy: Energy;
};
export type SatQuestionKind = 'multiple-choice' | 'open-response';
export type SatChoice = { id: string; label: string; text: string };
export type Mistake = {
  id: string;
  question: string;
  source: string;
  section: string;
  topic: string;
  difficulty: string;
  answer: string;
  correct: string;
  explanation: string;
  reason: string;
  status: 'Review again' | 'Still unsure' | 'Mastered';
  due: string;
  interval: number;
  card?: StoredCard;
  reviews?: StoredReview[];
  satQuestionId?: string;
  questionKind?: SatQuestionKind;
  choices?: SatChoice[];
  imageKey?: string;
  imageEssential?: boolean;
  imageDescription?: string;
};
export type Milestone = {
  title: string;
  done: boolean;
  evidence: string;
  date?: string;
};
export type Project = {
  id: string;
  ideaId: string;
  name: string;
  skills: string[];
  milestones: Milestone[];
  repo?: string;
  notes: string;
  defense: Record<string, string>;
  started: string;
};
export type Score = {
  id: string;
  date: string;
  math: number;
  reading: number;
  source: string;
};
export type Practice = {
  id: string;
  date: string;
  topic: string;
  section: string;
  questions: number;
  correct: number;
  minutes: number;
};
export type SatQuestion = {
  id: string;
  sessionId: string;
  kind: SatQuestionKind;
  questionText: string;
  choices?: SatChoice[];
  userAnswer: string;
  correctAnswer: string;
  correctness: boolean;
  correctnessOverride?: boolean;
  section: 'Math' | 'Reading & Writing';
  topic: string;
  difficulty?: string;
  source?: string;
  sourceQuestionId?: string;
  imageKey?: string;
  imageEssential?: boolean;
  imageDescription?: string;
  mistakeId?: string;
  createdAt: string;
};
export type SatPracticeSession = {
  id: string;
  date: string;
  section: 'Math' | 'Reading & Writing';
  topic: string;
  startedAt: string;
  completedAt?: string;
  seconds: number;
  questions: SatQuestion[];
};
export type University = {
  id: string;
  name: string;
  program: string;
  deadline: string;
  url: string;
  sat: string;
  aid: string;
  status: string;
  requirements: { title: string; done: boolean }[];
  notes: string;
};
export type Snapshot = {
  id: string;
  date: string;
  market: string;
  source: string;
  count: number;
  skills: Record<string, number>;
  roles: string[];
};
export type Repo = {
  name: string;
  url: string;
  description: string;
  language: string;
  updated: string;
  readiness: Record<string, boolean | null>;
  commits: number;
  issues: number;
  prs: number;
  release: string | null;
  readme: string;
  ci: string;
  languages: string[];
};
export type AppState = {
  version: 2;
  profile: {
    name: string;
    avatar: string;
    goal: string;
    focus: string;
    target: number;
    satDate: string;
    started: string;
    onboarded: boolean;
    energy: Energy;
    time: number;
    theme: string;
    accent: string;
    sounds: boolean;
    ambience: boolean;
    compact: boolean;
    market: string;
    boards: string;
  };
  projects: Project[];
  sessions: Session[];
  mistakes: Mistake[];
  scores: Score[];
  practice: Practice[];
  satSessions: SatPracticeSession[];
  captures: { id: string; text: string; date: string; done: boolean }[];
  skills: Record<string, { level: number; evidence: string; date: string }>;
  universities: University[];
  snapshots: Snapshot[];
  plan: { date: string; title: string; minutes: number; area: string }[];
  reflections: { date: string; text: string }[];
  github: {
    login: string;
    avatar: string;
    synced: string;
    repos: Repo[];
  } | null;
};
export type Action = { type: string; payload?: Record<string, unknown> };
export const reasons = [
  'Knowledge gap',
  'Careless error',
  'Misread',
  'Calculation',
  'Logic',
  'Time pressure',
  'Vocabulary',
  'Strategy',
  'Guess',
];
export const topics = [
  'Algebra',
  'Advanced Math',
  'Problem-solving & Data',
  'Geometry & Trigonometry',
  'Information & Ideas',
  'Craft & Structure',
  'Expression of Ideas',
  'Standard English Conventions',
];
export const levels = [
  'Not started',
  'Learning',
  'Practiced',
  'Implemented',
  'Demonstrated',
  'Strong',
];
export const branches: Record<string, string[]> = {
  Systems: ['Linux', 'Processes', 'Memory', 'Concurrency'],
  Networking: ['TCP/IP', 'DNS', 'HTTP', 'Protocol design'],
  'Distributed systems': [
    'Replication',
    'Partitioning',
    'Consensus',
    'Fault tolerance',
  ],
  Cloud: ['Docker', 'Kubernetes', 'Terraform', 'Observability'],
  'AI & data': ['Python', 'SQL', 'PyTorch', 'MLOps'],
  Security: ['Threat modeling', 'Cryptography', 'Monitoring', 'Secure design'],
};
export type Idea = {
  id: string;
  name: string;
  category: string;
  language: string;
  skills: string[];
  difficulty: string;
  weeks: string;
  why: string;
  architecture: string;
  advanced: string;
  milestones: string[];
  prerequisites: string;
  depth: number;
  interest: number;
};
const idea = (
  id: string,
  name: string,
  category: string,
  language: string,
  skills: string[],
  difficulty: string,
  weeks: string,
  why: string,
  architecture: string,
  advanced: string,
  milestones: string[],
  prerequisites: string,
  depth = 90,
  interest = 80,
): Idea => ({
  id,
  name,
  category,
  language,
  skills,
  difficulty,
  weeks,
  why,
  architecture,
  advanced,
  milestones,
  prerequisites,
  depth,
  interest,
});
export const ideas: Idea[] = [
  idea(
    'tcp',
    'Multithreaded TCP server',
    'Networking',
    'Go',
    ['TCP/IP', 'Concurrency', 'Protocol design'],
    'Intermediate',
    '4–6',
    'Understand what really happens between a client and a server.',
    'Client → framed byte stream → connection handler → worker pool → response',
    'Add backpressure, graceful shutdown, and p99 latency benchmarks.',
    [
      'Explain a request’s path through the server',
      'Accept one local TCP connection',
      'Design a length-prefixed message format',
      'Test a fragmented TCP message',
      'Handle multiple clients with a bounded worker pool',
      'Test slow clients and disconnects',
      'Measure throughput and tail latency',
      'Document architecture and publish a reproducible release',
    ],
    'Basic Go, functions, and error handling',
  ),
  idea(
    'shell',
    'Unix shell',
    'Systems',
    'C / Rust',
    ['Linux', 'Processes', 'Memory'],
    'Intermediate',
    '4–6',
    'Build the tool you use to talk to an operating system.',
    'Input → tokenizer → parser → process creation → pipe / redirection',
    'Add job control, signals, and a tested parser.',
    [
      'Read input and tokenize one command',
      'Execute a command with arguments',
      'Support built-in cd and exit',
      'Connect two processes with a pipe',
      'Implement input and output redirection',
      'Handle signals and child cleanup',
      'Test parser edge cases and memory safety',
      'Document design decisions and publish a release',
    ],
    'Command-line basics and a little C or Rust',
  ),
  idea(
    'allocator',
    'Memory allocator',
    'Systems',
    'C / Rust',
    ['Memory', 'Algorithms', 'Performance'],
    'Advanced',
    '5–8',
    'Make allocation, fragmentation, and memory ownership tangible.',
    'Allocation request → free list → block split / coalesce → heap',
    'Compare segregated lists with a buddy allocator under repeatable workloads.',
    [
      'Draw the heap and block metadata',
      'Implement aligned allocation',
      'Implement free and coalescing',
      'Handle allocation failures safely',
      'Add realloc and boundary tests',
      'Check invariants across randomized workloads',
      'Benchmark fragmentation and throughput',
      'Write a design report and reproducible release',
    ],
    'Pointers, memory layout, and testing',
  ),
  idea(
    'redis',
    'Mini Redis',
    'Databases',
    'Go / Rust',
    ['TCP/IP', 'Memory', 'Concurrency'],
    'Intermediate',
    '5–7',
    'Connect protocol design to indexing, persistence, and concurrency.',
    'RESP parser → command dispatcher → in-memory map → append-only log',
    'Add TTL, snapshots, recovery tests, and workload benchmarks.',
    [
      'Specify a small command set',
      'Parse a framed request',
      'Implement GET and SET',
      'Handle concurrent access',
      'Add expiration with a fake clock',
      'Persist and replay an append-only log',
      'Test crash recovery and benchmark',
      'Write architecture notes and publish',
    ],
    'Basic networking and data structures',
  ),
  idea(
    'database',
    'Small database engine',
    'Databases',
    'Rust / C++',
    ['SQL', 'Memory', 'Algorithms'],
    'Advanced',
    '8–12',
    'Learn why storage engines make the trade-offs they do.',
    'Query → parser → B-tree → buffer pool → page store → write-ahead log',
    'Add transactions, crash recovery, and explainable query plans.',
    [
      'Define a record and page layout',
      'Read and write fixed-size pages',
      'Implement a B-tree index',
      'Parse a small query language',
      'Add a bounded buffer pool',
      'Implement durable writes and recovery tests',
      'Benchmark range scans and memory usage',
      'Document consistency guarantees and release',
    ],
    'Data structures, files, and basic SQL',
  ),
  idea(
    'git',
    'Mini Git',
    'Systems',
    'Rust',
    ['Linux', 'Algorithms', 'Cryptography'],
    'Intermediate',
    '4–6',
    'Explore content addressing and version history from first principles.',
    'File → content hash → object store → tree → commit graph',
    'Add branching, tree diffs, and merge conflict reporting.',
    [
      'Define the object format',
      'Store a content-addressed blob',
      'Build a directory tree',
      'Create and read a commit',
      'Walk history and calculate diffs',
      'Support branches with explicit references',
      'Test malformed objects and integrity',
      'Explain the object model and publish',
    ],
    'Files, hashing, and trees',
  ),
  idea(
    'dns',
    'DNS server',
    'Networking',
    'Go',
    ['DNS', 'Protocol design', 'Concurrency'],
    'Intermediate',
    '4–6',
    'Turn domain lookup into a protocol you can explain.',
    'DNS query → parser → zone lookup / cache → encoded response',
    'Add TTL-aware caching and bounded recursive resolution.',
    [
      'Read the DNS packet format',
      'Decode a local query',
      'Serve one authoritative A record',
      'Encode errors and unsupported requests',
      'Implement a TTL-aware cache',
      'Test malformed and truncated messages',
      'Measure latency in a local test harness',
      'Document limits and release',
    ],
    'Binary encoding and networking basics',
  ),
  idea(
    'traffic',
    'Network traffic analyzer',
    'Networking',
    'Python / Rust',
    ['TCP/IP', 'Observability', 'Monitoring'],
    'Intermediate',
    '4–6',
    'Turn your own recorded network traffic into useful explanations.',
    'Owned sample capture → packet parser → flow aggregation → summary',
    'Add replayable anomaly fixtures and an efficient streaming parser.',
    [
      'Choose synthetic or owned sample captures',
      'Parse packet headers',
      'Group packets into flows',
      'Calculate latency and volume summaries',
      'Explain retransmissions from test captures',
      'Test malformed inputs safely',
      'Profile memory on large samples',
      'Publish documented synthetic examples',
    ],
    'Networking basics; use only authorized captures',
  ),
  idea(
    'protocol',
    'Custom network protocol',
    'Networking',
    'Rust',
    ['TCP/IP', 'Protocol design', 'Secure design'],
    'Advanced',
    '5–8',
    'Design an explicit contract for reliable communication.',
    'State machine → encoder → transport → decoder → application',
    'Add version negotiation, bounded queues, and fault injection tests.',
    [
      'Define the use case and invariants',
      'Draw the protocol state machine',
      'Encode and decode one message',
      'Specify limits and error behavior',
      'Handle fragmented input',
      'Test reordering, timeouts, and disconnects',
      'Benchmark message overhead',
      'Write a protocol specification and release',
    ],
    'Networking and state machines',
  ),
  idea(
    'queue',
    'Distributed job queue',
    'Distributed systems',
    'Go',
    ['Replication', 'Concurrency', 'Fault tolerance'],
    'Advanced',
    '6–9',
    'Understand the gap between enqueueing work and completing it reliably.',
    'Producer → durable queue → lease manager → workers → result store',
    'Add retries, dead-letter queues, and idempotent processing.',
    [
      'Specify delivery guarantees',
      'Persist one job',
      'Run one worker with an acknowledgement',
      'Implement expiring leases',
      'Recover work after worker failure',
      'Add idempotency and bounded retries',
      'Test failure cases and throughput',
      'Document semantics and publish',
    ],
    'Networking, storage, and concurrency',
  ),
  idea(
    'kv',
    'Distributed key-value store',
    'Distributed systems',
    'Go / Rust',
    ['Replication', 'Consensus', 'Partitioning'],
    'Advanced',
    '8–12',
    'Make consistency trade-offs visible through an implementation.',
    'Client → leader → replication log → replicas → state machine',
    'Implement a published consensus algorithm with deterministic fault tests.',
    [
      'Specify consistency and failure assumptions',
      'Implement a single-node store',
      'Define replication messages',
      'Replicate one write with acknowledgement',
      'Test node failures and recovery',
      'Add partitions and documented conflict handling',
      'Measure availability and latency under failures',
      'Defend the design and publish',
    ],
    'A completed networking or database project',
  ),
  idea(
    'dfs',
    'Distributed file system',
    'Distributed systems',
    'Go',
    ['Replication', 'Partitioning', 'Fault tolerance'],
    'Advanced',
    '8–12',
    'Explore how large files survive machine failures.',
    'Client → metadata service → chunk placement → replicated chunk nodes',
    'Add rebalancing, integrity checks, and recoverable metadata.',
    [
      'Define chunk and metadata formats',
      'Store and fetch a local chunk',
      'Split and reconstruct a file',
      'Replicate chunks across local nodes',
      'Detect missing or corrupt chunks',
      'Test recovery and metadata failures',
      'Benchmark file sizes and node counts',
      'Document failure guarantees and release',
    ],
    'Files, networking, and replication',
  ),
  idea(
    'k8s',
    'Kubernetes infrastructure lab',
    'Cloud',
    'YAML / Go',
    ['Docker', 'Kubernetes', 'Terraform'],
    'Intermediate',
    '5–7',
    'Build infrastructure another engineer can reproduce.',
    'Declarative config → local cluster → workloads → telemetry',
    'Add policy checks, progressive rollouts, and disaster recovery drills.',
    [
      'Containerize a small owned service',
      'Create a local cluster',
      'Deploy with resource requests and limits',
      'Add health checks and configuration',
      'Define repeatable environment setup',
      'Test rolling updates and recovery',
      'Add dashboards and deployment checks',
      'Publish a local-first runbook',
    ],
    'Linux and Docker; local cluster first',
  ),
  idea(
    'platform',
    'Internal developer platform',
    'Cloud',
    'Go',
    ['Kubernetes', 'Observability', 'Secure design'],
    'Advanced',
    '7–10',
    'Reduce the friction between code and a reliable running service.',
    'Service template → validation → build pipeline → deployment → service catalog',
    'Add policy enforcement and rollback with an audited change history.',
    [
      'Interview one potential user or define a scenario',
      'Create a repeatable service template',
      'Validate configuration locally',
      'Build and test the artifact',
      'Deploy to a local environment',
      'Add ownership and telemetry',
      'Test rollback and failure messaging',
      'Write an onboarding guide and release',
    ],
    'Containers, CI, and one completed backend project',
  ),
  idea(
    'sre',
    'Reliability engineering lab',
    'Cloud',
    'Python / Go',
    ['Observability', 'Monitoring', 'Fault tolerance'],
    'Intermediate',
    '5–7',
    'Measure reliability and learn from controlled failure.',
    'Owned test service → load → metrics / traces → SLO → recovery exercise',
    'Compare recovery strategies and document an error budget.',
    [
      'Define a user-facing reliability goal',
      'Instrument a local service',
      'Create repeatable load',
      'Define a measurable SLO',
      'Build a useful dashboard',
      'Run a controlled local failure exercise',
      'Measure recovery and write a postmortem',
      'Publish results and a runbook',
    ],
    'Linux, HTTP, and basic metrics',
  ),
  idea(
    'stream',
    'Streaming data platform',
    'Data',
    'Python / SQL',
    ['SQL', 'Partitioning', 'Observability'],
    'Advanced',
    '6–9',
    'Make a continuous stream correct, observable, and recoverable.',
    'Synthetic events → broker → processor → analytical store → quality checks',
    'Add event-time windows and replay with deduplication.',
    [
      'Generate a bounded synthetic event stream',
      'Define event schema and validation',
      'Ingest into a local broker',
      'Transform and aggregate events',
      'Handle duplicates and late arrivals',
      'Add quality checks and replay tests',
      'Measure lag and throughput',
      'Publish reproducible datasets and design',
    ],
    'SQL and Python',
  ),
  idea(
    'mlpipe',
    'ML training-to-deployment pipeline',
    'AI & ML',
    'Python',
    ['Python', 'PyTorch', 'MLOps'],
    'Intermediate',
    '6–8',
    'Treat an ML result as a reproducible engineering system.',
    'Versioned data → training → evaluation gate → model artifact → serving',
    'Add drift monitoring and rollback without promoting unvalidated models.',
    [
      'Choose an openly licensed dataset',
      'Freeze train and test splits',
      'Build a simple baseline',
      'Train with reproducible configuration',
      'Evaluate with uncertainty and error slices',
      'Package an inference service',
      'Test deployment and data validation',
      'Publish a model card and reproducible report',
    ],
    'Python and introductory statistics',
  ),
  idea(
    'serving',
    'Model serving platform',
    'AI & ML',
    'Python / Go',
    ['MLOps', 'Concurrency', 'Observability'],
    'Advanced',
    '6–9',
    'Explore the system behind a useful model prediction.',
    'Request → bounded queue → batching → model worker → telemetry',
    'Add adaptive batching and benchmark latency / cost trade-offs.',
    [
      'Define a serving contract',
      'Load a small local model',
      'Serve one validated request',
      'Add bounded batching',
      'Handle cancellation and overload',
      'Instrument latency and errors',
      'Benchmark throughput against a baseline',
      'Document operating limits and publish',
    ],
    'A small ML project and HTTP basics',
  ),
  idea(
    'eval',
    'AI evaluation framework',
    'AI & ML',
    'Python',
    ['Python', 'MLOps', 'Algorithms'],
    'Intermediate',
    '4–6',
    'Make model-quality claims auditable and reproducible.',
    'Frozen dataset → adapters → evaluation runner → metrics → report',
    'Add confidence intervals and regression gates.',
    [
      'Define a measurable evaluation question',
      'Freeze a small licensed benchmark',
      'Build a model adapter',
      'Run deterministic baseline evaluations',
      'Validate metrics with hand-checked cases',
      'Analyze failures and uncertainty',
      'Add versioned regression reports',
      'Publish methodology and limitations',
    ],
    'Python and basic statistics',
  ),
  idea(
    'security',
    'Security monitoring platform',
    'Security',
    'Python',
    ['Monitoring', 'Threat modeling', 'Observability'],
    'Intermediate',
    '5–8',
    'Turn synthetic security events into explainable defensive signals.',
    'Owned / synthetic logs → parser → rules → alert review → timeline',
    'Measure false positives with replayable labeled fixtures.',
    [
      'Define an authorized defensive use case',
      'Generate synthetic event fixtures',
      'Normalize events into a schema',
      'Implement transparent detection rules',
      'Add an alert-review workflow',
      'Measure false positives and missing events',
      'Test bounded ingestion and retention',
      'Publish safe fixtures and a threat model',
    ],
    'Python, logs, and security fundamentals',
  ),
  idea(
    'integrity',
    'File integrity monitor',
    'Security',
    'Rust / Python',
    ['Cryptography', 'Linux', 'Secure design'],
    'Intermediate',
    '3–5',
    'Make file changes visible while understanding trust boundaries.',
    'Selected owned folder → baseline hashes → change scan → event journal',
    'Add signed baselines and incremental scanning.',
    [
      'Define the monitored owned directory',
      'Build a hash manifest',
      'Detect added, changed, and removed files',
      'Handle links and permissions deliberately',
      'Store a verifiable event journal',
      'Test interrupted scans and large files',
      'Profile incremental performance',
      'Publish a threat model and release',
    ],
    'Files, permissions, and hashing',
  ),
  idea(
    'molecule',
    'Molecular property prediction',
    'Scientific computing',
    'Python',
    ['Python', 'PyTorch', 'Algorithms'],
    'Intermediate',
    '6–9',
    'Connect chemistry to careful, testable computational modeling.',
    'Licensed molecular data → featurization → scaffold split → model → evaluation',
    'Compare fingerprints with graph models and analyze generalization.',
    [
      'Choose a licensed molecular dataset and property',
      'Validate structures and remove duplicates',
      'Freeze a leakage-resistant split',
      'Fit a fingerprint baseline',
      'Evaluate error slices and uncertainty',
      'Compare a graph-based model',
      'Document failure cases and reproducibility',
      'Publish a scientific report and model card',
    ],
    'Python, basic chemistry, and statistics',
  ),
  idea(
    'similarity',
    'Molecular similarity search',
    'Scientific computing',
    'Python / Rust',
    ['Algorithms', 'Python', 'Performance'],
    'Intermediate',
    '5–7',
    'Explore the representation choices behind molecular discovery.',
    'SMILES → validated fingerprints → index → nearest neighbors → explanation',
    'Compare exact and approximate search with recall / latency curves.',
    [
      'Validate a small molecular dataset',
      'Generate molecular fingerprints',
      'Implement exact similarity search',
      'Build a repeatable evaluation set',
      'Add an approximate index',
      'Measure recall against exact results',
      'Analyze representation failures',
      'Publish results and a reproducible tool',
    ],
    'Chemistry basics and data structures',
  ),
  idea(
    'science',
    'Distributed scientific computing',
    'Scientific computing',
    'Python / Go',
    ['Partitioning', 'Fault tolerance', 'Python'],
    'Advanced',
    '8–12',
    'Run a scientific computation across workers without losing reproducibility.',
    'Experiment specification → partitioned jobs → workers → validated result merge',
    'Add checkpointing, heterogeneous workers, and scaling analysis.',
    [
      'Choose a deterministic CPU-friendly simulation',
      'Create a validated serial reference',
      'Partition the computation',
      'Dispatch work to local workers',
      'Validate and merge results',
      'Recover interrupted jobs',
      'Measure scaling and numerical agreement',
      'Publish methods, data, and a release',
    ],
    'A scientific-computing baseline and networking',
  ),
];
export function blankState(now = new Date().toISOString()): AppState {
  return {
    version: 2,
    profile: {
      name: '',
      avatar: 'Y',
      goal: 'Study engineering in the United States',
      focus: 'Networking',
      target: 1500,
      satDate: '',
      started: now,
      onboarded: false,
      energy: 1,
      time: 20,
      theme: 'dark',
      accent: 'violet',
      sounds: false,
      ambience: false,
      compact: false,
      market: 'United States',
      boards: '',
    },
    projects: [],
    sessions: [],
    mistakes: [],
    scores: [],
    practice: [],
    satSessions: [],
    captures: [],
    skills: {},
    universities: [],
    snapshots: [],
    plan: [],
    reflections: [],
    github: null,
  };
}
function legacyTask(task: Record<string, unknown>): Task {
  const base = {
    id: String(task.id || 'legacy-task'),
    title: String(task.title || 'Saved focus session'),
    why: String(task.why || ''),
    minutes: Number(task.minutes) || 10,
    area: (['Engineering', 'SAT', 'University', 'Recovery'].includes(
      String(task.area),
    )
      ? task.area
      : 'Recovery') as Area,
    skills: Array.isArray(task.skills) ? task.skills.map(String) : [],
    step: String(task.step || 'Choose one small next action.'),
  };
  if (base.area === 'Engineering' && typeof task.projectId === 'string')
    return {
      ...base,
      kind: 'engineering',
      area: 'Engineering',
      projectId: task.projectId,
      milestoneIndex: Number.isInteger(task.milestoneIndex)
        ? Number(task.milestoneIndex)
        : Math.max(0, Number(String(task.id).split(':').at(-1)) || 0),
    };
  if (base.area === 'SAT')
    return {
      ...base,
      kind: 'sat-practice',
      area: 'SAT',
      topic: base.skills[0] || 'Algebra',
      section:
        topics.indexOf(base.skills[0]) >= 4 ? 'Reading & Writing' : 'Math',
      questionTarget: 3,
    };
  if (base.area === 'University') return { ...base, kind: 'generic' };
  return {
    ...base,
    kind: base.area === 'Recovery' ? 'recovery' : 'generic',
    projectId: typeof task.projectId === 'string' ? task.projectId : undefined,
  };
}
export function hydrateState(input: unknown): AppState {
  const fresh = blankState();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fresh;
  const raw = input as Record<string, unknown>;
  const state = {
    ...fresh,
    ...raw,
    version: 2,
    profile: {
      ...fresh.profile,
      ...(raw.profile && typeof raw.profile === 'object'
        ? (raw.profile as AppState['profile'])
        : {}),
    },
  } as AppState;
  for (const key of [
    'projects',
    'sessions',
    'mistakes',
    'scores',
    'practice',
    'satSessions',
    'captures',
    'universities',
    'snapshots',
    'plan',
    'reflections',
  ] as const)
    if (!Array.isArray(state[key]))
      (state as unknown as Record<string, unknown>)[key] = [];
  if (!state.skills || typeof state.skills !== 'object') state.skills = {};
  if (state.github !== null && typeof state.github !== 'object')
    state.github = null;
  state.sessions = state.sessions.map((session) => ({
    ...session,
    task:
      session.task && typeof session.task === 'object' && 'kind' in session.task
        ? session.task
        : legacyTask((session.task || {}) as Record<string, unknown>),
  }));
  return state;
}
export function newProject(
  id: string,
  now = new Date().toISOString(),
): Project {
  const x = ideas.find((i) => i.id === id);
  if (!x) throw new Error('Choose a project from the library.');
  return {
    id: crypto.randomUUID(),
    ideaId: x.id,
    name: x.name,
    skills: x.skills,
    milestones: x.milestones.map((title) => ({
      title,
      done: false,
      evidence: '',
    })),
    notes: '',
    defense: {},
    started: now,
  };
}
export const progress = (p: Project) =>
  Math.round(
    (p.milestones.filter((m) => m.done).length /
      Math.max(1, p.milestones.length)) *
      100,
  );
export function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}
export function demoState(): AppState {
  const s = blankState(daysAgo(42));
  s.profile.name = '';
  const p = newProject('tcp', daysAgo(20));
  p.id = 'demo-tcp';
  p.milestones.slice(0, 3).forEach((m, i) => {
    m.done = true;
    m.evidence = [
      'Wrote a request-flow diagram and explained each component.',
      'Accepted one local client and tested graceful close.',
      'Documented the 4-byte length header and message limit.',
    ][i];
    m.date = daysAgo(10 - i * 3);
  });
  s.projects = [p];
  s.scores = [
    {
      id: 's1',
      date: daysAgo(40).slice(0, 10),
      math: 610,
      reading: 590,
      source: 'Example practice test',
    },
    {
      id: 's2',
      date: daysAgo(27).slice(0, 10),
      math: 640,
      reading: 600,
      source: 'Example practice test',
    },
    {
      id: 's3',
      date: daysAgo(14).slice(0, 10),
      math: 670,
      reading: 630,
      source: 'Example practice test',
    },
    {
      id: 's4',
      date: daysAgo(2).slice(0, 10),
      math: 690,
      reading: 630,
      source: 'Example practice test',
    },
  ];
  s.practice = Array.from({ length: 12 }, (_, i) => ({
    id: 'pr' + i,
    date: daysAgo(i * 3).slice(0, 10),
    topic: topics[i % 8],
    section: i % 8 < 4 ? 'Math' : 'Reading & Writing',
    questions: 10,
    correct: 6 + (i % 5),
    minutes: 15,
  }));
  s.sessions = [0, 1, 3, 5, 7, 9, 12, 15, 18, 20, 22, 26, 29, 33, 36, 40].map(
    (d, i) => ({
      id: 'ss' + i,
      task: legacyTask({
        id: 'example' + i,
        title: i % 2 ? 'Review algebra mistakes' : 'Work on the TCP server',
        area: i % 2 ? 'SAT' : 'Engineering',
        minutes: 25,
        skills: i % 2 ? ['Algebra'] : ['TCP/IP', 'Concurrency'],
        why: 'Build a small, useful piece.',
        step: 'Write one test.',
        projectId: i % 2 ? undefined : p.id,
      }),
      date: daysAgo(d),
      seconds: (15 + (i % 4) * 10) * 60,
      notes: 'Example session, shown only in the demo.',
      outcome: 'progress',
      energy: 1,
    }),
  );
  s.skills = {
    'TCP/IP': {
      level: 3,
      evidence: 'Example: implemented and tested length-prefixed framing.',
      date: daysAgo(4),
    },
    Linux: {
      level: 2,
      evidence:
        'Example: used processes and inspected sockets in the local lab.',
      date: daysAgo(5),
    },
    Concurrency: {
      level: 1,
      evidence: 'Example: wrote notes about bounded workers.',
      date: daysAgo(8),
    },
    Python: {
      level: 2,
      evidence: 'Example: wrote reproducible data scripts.',
      date: daysAgo(12),
    },
  };
  return s;
}
export function recommendations(
  s: AppState,
  energy = s.profile.energy,
  time = s.profile.time,
  now = Date.now(),
): Task[] {
  const max = [10, 20, 45, 90][energy],
    minutes = Math.min(max, time),
    today = new Date(now).toISOString().slice(0, 10);
  const p = s.projects.find((p) => progress(p) < 100);
  const due = s.mistakes
    .filter((m) => (m.card ? m.card.due <= now : m.due <= today))
    .sort(
      (a, b) =>
        (a.card?.due ?? new Date(a.due).getTime()) -
          (b.card?.due ?? new Date(b.due).getTime()) ||
        a.id.localeCompare(b.id),
    );
  const weak = topics
    .map((topic) => {
      const legacy = s.practice.filter((p) => p.topic === topic),
        questions = s.satSessions
          .flatMap((x) => x.questions)
          .filter((q) => q.topic === topic);
      return {
        topic,
        total: legacy.reduce((a, p) => a + p.questions, 0) + questions.length,
        correct:
          legacy.reduce((a, p) => a + p.correct, 0) +
          questions.filter((q) => q.correctness).length,
      };
    })
    .filter((t) => t.total > 0)
    .sort(
      (a, b) =>
        a.correct / a.total - b.correct / b.total ||
        a.topic.localeCompare(b.topic),
    )[0];
  const tasks: Task[] = [];
  if (p) {
    const milestoneIndex = p.milestones.findIndex((m) => !m.done),
      m = p.milestones[milestoneIndex],
      idea = ideas.find((i) => i.id === p.ideaId)!;
    const guide = milestoneGuideFor(idea, milestoneIndex);
    tasks.push({
      kind: 'engineering',
      id: p.id + ':' + milestoneIndex,
      projectId: p.id,
      milestoneIndex,
      title: energy === 0 ? 'Open your notes. Find your next line.' : m.title,
      minutes,
      area: 'Engineering',
      skills: p.skills,
      why: guide.why,
      step:
        energy === 0
          ? 'Open the repository and reread your most recent engineering note. Write one sentence about where you stopped.'
          : guide.firstAction,
    });
  }
  if (due.length) {
    const chosen = due.slice(0, Math.min(due.length, energy === 0 ? 1 : 3));
    tasks.push({
      kind: 'sat-review',
      id: 'sat-review:' + today + ':' + chosen.map((m) => m.id).join('-'),
      title: `Revisit ${chosen.length} saved SAT mistake${chosen.length === 1 ? '' : 's'}`,
      minutes: Math.min(minutes, 25),
      area: 'SAT',
      skills: [chosen[0]?.topic || 'SAT review'],
      why: 'Retrieving the idea again helps you check what stuck. The exact assigned questions are ready inside Focus.',
      step: 'Attempt the first assigned question from memory before revealing the saved answer.',
      mistakeIds: chosen.map((m) => m.id),
    });
  } else {
    const topic = weak?.topic || 'Algebra',
      section = topics.indexOf(topic) >= 4 ? 'Reading & Writing' : 'Math',
      questionTarget = energy === 0 ? 3 : 10;
    tasks.push({
      kind: 'sat-practice',
      id: 'sat-practice:' + today + ':' + topic,
      title: `Practice ${questionTarget} ${topic} questions`,
      minutes: Math.min(minutes, 25),
      area: 'SAT',
      skills: [topic],
      why: weak
        ? `${topic} has the lowest recorded accuracy. A short, focused set helps you identify what needs attention.`
        : 'Start with a small question set. Every answer will update the session automatically.',
      step: 'Start the practice session and add the first actual question.',
      topic,
      section,
      questionTarget,
    });
  }
  const upcoming = s.universities
    .filter((u) => u.deadline && u.deadline >= today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  if (upcoming)
    tasks.push({
      kind: 'university',
      id: 'uni:' + upcoming.id,
      universityId: upcoming.id,
      title: `Check one requirement for ${upcoming.name}`,
      area: 'University',
      minutes: Math.min(minutes, 15),
      skills: ['Application preparation'],
      why: 'A verified requirement turns an uncertain application plan into a concrete next step.',
      step: 'Open the official admissions page. Record the requirement, source, and date checked.',
    });
  if (!p)
    tasks.push({
      kind: 'generic',
      id: 'choose-project',
      title: 'Choose one project that makes you curious',
      area: 'Engineering',
      minutes: 10,
      skills: ['Engineering planning'],
      why: 'One well-finished project teaches more than a long list of plans.',
      step: 'Open the engineering library. Read one architecture and choose a small first milestone.',
    });
  const daysToSat = s.profile.satDate
    ? (new Date(s.profile.satDate).getTime() - now) / 86400000
    : Infinity;
  if (due.length || (daysToSat >= 0 && daysToSat < 30))
    tasks.sort((a, b) => Number(b.area === 'SAT') - Number(a.area === 'SAT'));
  if (upcoming && (new Date(upcoming.deadline).getTime() - now) / 86400000 < 14)
    tasks.sort(
      (a, b) =>
        Number(b.area === 'University') - Number(a.area === 'University'),
    );
  return tasks.slice(0, energy === 0 ? 1 : energy === 1 ? 2 : 3);
}
export function guideForTask(s: AppState, task: EngineeringTask) {
  const project = s.projects.find((p) => p.id === task.projectId),
    idea = project && ideas.find((i) => i.id === project.ideaId);
  return idea ? milestoneGuideFor(idea, task.milestoneIndex) : undefined;
}
export function mistakesForTask(s: AppState, task: SatReviewTask) {
  const byId = new Map(s.mistakes.map((m) => [m.id, m]));
  return task.mistakeIds
    .map((id) => byId.get(id))
    .filter((m): m is Mistake => !!m);
}
export function projectScore(i: Idea, s: AppState) {
  const known = new Set([
    ...s.projects.flatMap((p) => p.skills),
    ...(s.github?.repos.flatMap((r) => r.languages) || []),
  ]);
  const diversity = Math.round(
    (i.skills.filter((k) => !known.has(k)).length / i.skills.length) * 100,
  );
  const snap = s.snapshots.filter((x) => x.market === s.profile.market).at(-1);
  const market =
    snap && snap.count
      ? Math.min(
          100,
          Math.round(
            Math.max(
              ...i.skills.map((k) => (snap.skills[k] || 0) / snap.count),
            ) * 100,
          ),
        )
      : 50;
  const personal =
    s.profile.focus &&
    [i.category, ...i.skills, i.language].some((k) =>
      k.toLowerCase().includes(s.profile.focus.toLowerCase()),
    )
      ? 100
      : i.interest;
  const completion = i.difficulty === 'Advanced' ? 50 : 85;
  const university = 85;
  return {
    total: Math.round(
      i.depth * 0.25 +
        market * 0.25 +
        diversity * 0.2 +
        university * 0.15 +
        personal * 0.1 +
        completion * 0.05,
    ),
    depth: i.depth,
    market,
    diversity,
    university,
    personal,
    completion,
    hasMarket: !!snap,
  };
}
function str(v: unknown, max = 1000) {
  if (typeof v !== 'string' || v.length > max)
    throw new Error('Please enter valid text within the field limit.');
  return v.trim();
}
function required(v: unknown, max = 1000) {
  const r = str(v, max);
  if (!r) throw new Error('Please complete all required fields.');
  return r;
}
function num(v: unknown, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max)
    throw new Error(`Enter a whole number between ${min} and ${max}.`);
  return n;
}
function date(v: unknown) {
  const t = required(v, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(t) ||
    !Number.isFinite(new Date(t).getTime()) ||
    new Date(t).toISOString().slice(0, 10) !== t
  )
    throw new Error('Enter a valid date.');
  return t;
}
function url(v: unknown) {
  const x = str(v, 500);
  if (!x) return '';
  const u = new URL(x);
  if (u.protocol !== 'https:') throw new Error('Use an https link.');
  return x;
}
function satSection(v: unknown): SatQuestion['section'] {
  const section = required(v, 50);
  if (section !== 'Math' && section !== 'Reading & Writing')
    throw new Error('Choose an SAT section.');
  return section;
}
function choiceList(v: unknown): SatChoice[] {
  if (!Array.isArray(v)) return [];
  const choices = v.slice(0, 8).map((choice, i) => {
    if (!choice || typeof choice !== 'object')
      throw new Error('Each answer choice needs a label and text.');
    const x = choice as Record<string, unknown>;
    return {
      id:
        str(x.id || String.fromCharCode(65 + i), 30) ||
        String.fromCharCode(65 + i),
      label:
        str(x.label || String.fromCharCode(65 + i), 10) ||
        String.fromCharCode(65 + i),
      text: required(x.text, 2000),
    };
  });
  if (new Set(choices.map((c) => c.id)).size !== choices.length)
    throw new Error('Answer choices must be unique.');
  return choices;
}
function numericAnswer(value: string) {
  const compact = value.trim().replace(/,/g, '').replace(/−/g, '-');
  if (/^[-+]?\d+(?:\.\d+)?$/.test(compact)) return Number(compact);
  const fraction = compact.match(/^([-+]?\d+)\s*\/\s*([-+]?\d+)$/);
  if (fraction && Number(fraction[2]) !== 0)
    return Number(fraction[1]) / Number(fraction[2]);
  return null;
}
export function answersEquivalent(a: string, b: string) {
  const left = a.trim().toLowerCase().replace(/\s+/g, ' '),
    right = b.trim().toLowerCase().replace(/\s+/g, ' ');
  if (left === right) return true;
  const x = numericAnswer(left),
    y = numericAnswer(right);
  return x !== null && y !== null && Math.abs(x - y) < 1e-9;
}
function taskFromPayload(t: Record<string, unknown>): Task {
  const area = required(t.area, 20) as Area;
  if (!['Engineering', 'SAT', 'University', 'Recovery'].includes(area))
    throw new Error('Invalid task area.');
  const base = {
    id: required(t.id, 300),
    title: required(t.title, 300),
    why: str(t.why, 2000),
    step: str(t.step, 2000),
    area,
    minutes: num(t.minutes, 1, 180),
    skills: Array.isArray(t.skills)
      ? t.skills.slice(0, 10).map((x) => str(x, 80))
      : [],
  };
  const kind = str(t.kind || 'generic', 30);
  if (kind === 'engineering') {
    if (area !== 'Engineering') throw new Error('Invalid engineering task.');
    return {
      ...base,
      kind,
      area,
      projectId: required(t.projectId, 100),
      milestoneIndex: num(t.milestoneIndex, 0, 100),
    };
  }
  if (kind === 'sat-review') {
    if (area !== 'SAT' || !Array.isArray(t.mistakeIds) || !t.mistakeIds.length)
      throw new Error('Invalid SAT review task.');
    return {
      ...base,
      kind,
      area,
      mistakeIds: t.mistakeIds.slice(0, 10).map((x) => required(x, 100)),
    };
  }
  if (kind === 'sat-practice') {
    if (area !== 'SAT') throw new Error('Invalid SAT practice task.');
    return {
      ...base,
      kind,
      area,
      topic: required(t.topic, 100),
      section: satSection(t.section),
      questionTarget: num(t.questionTarget, 1, 100),
    };
  }
  if (kind === 'university') {
    if (area !== 'University') throw new Error('Invalid university task.');
    return { ...base, kind, area, universityId: required(t.universityId, 100) };
  }
  return {
    ...base,
    kind: area === 'Recovery' ? 'recovery' : 'generic',
    projectId: typeof t.projectId === 'string' ? t.projectId : undefined,
  };
}
export function applyAction(
  current: AppState,
  action: Action,
  now = new Date().toISOString(),
): AppState {
  const s = structuredClone(current),
    p = action.payload || {};
  const id = () => crypto.randomUUID();
  switch (action.type) {
    case 'journey.start': {
      if (s.profile.onboarded)
        throw new Error('Your journey is already active.');
      const clean = blankState(now);
      clean.profile = {
        ...clean.profile,
        onboarded: true,
        name: required(p.name, 60),
        goal: required(p.goal, 250),
        target: num(p.target, 400, 1600),
      };
      if (clean.profile.target % 10)
        throw new Error('SAT targets use increments of 10.');
      if (p.project)
        clean.projects.push(newProject(required(p.project, 40), now));
      return clean;
    }
    case 'profile.update': {
      const allowed = [
        'name',
        'avatar',
        'goal',
        'focus',
        'satDate',
        'theme',
        'accent',
        'market',
        'boards',
      ];
      for (const k of allowed)
        if (k in p)
          (s.profile as unknown as Record<string, unknown>)[k] = str(
            p[k],
            k === 'boards' ? 1000 : 250,
          );
      if ('target' in p) s.profile.target = num(p.target, 400, 1600);
      if (s.profile.target % 10)
        throw new Error('SAT targets use increments of 10.');
      if (s.profile.satDate) date(s.profile.satDate);
      if ('energy' in p) s.profile.energy = num(p.energy, 0, 3) as Energy;
      if ('time' in p) s.profile.time = num(p.time, 5, 180);
      for (const k of ['sounds', 'ambience', 'compact'] as const)
        if (k in p) {
          if (typeof p[k] !== 'boolean') throw new Error('Invalid preference.');
          s.profile[k] = p[k] as boolean;
        }
      break;
    }
    case 'project.add': {
      if (s.projects.length >= 8)
        throw new Error(
          'Keep your portfolio focused on up to eight serious projects.',
        );
      const ideaId = required(p.ideaId, 40);
      if (s.projects.some((x) => x.ideaId === ideaId))
        throw new Error('This project is already in your lab.');
      s.projects.push(newProject(ideaId, now));
      break;
    }
    case 'project.update': {
      const project = s.projects.find((x) => x.id === p.id);
      if (!project) throw new Error('Project not found.');
      if ('notes' in p) project.notes = str(p.notes, 20000);
      if ('repo' in p) {
        const u = url(p.repo);
        if (u && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(u))
          throw new Error('Use a GitHub repository URL.');
        project.repo = u;
      }
      break;
    }
    case 'milestone.complete': {
      const project = s.projects.find((x) => x.id === p.id);
      if (!project) throw new Error('Project not found.');
      const index = num(p.index, 0, project.milestones.length - 1);
      const m = project.milestones[index];
      if (project.milestones.slice(0, index).some((x) => !x.done))
        throw new Error('Finish the prerequisite milestone first.');
      m.evidence = required(p.evidence, 3000);
      m.done = true;
      m.date = now;
      break;
    }
    case 'defense.save': {
      const project = s.projects.find((x) => x.id === p.id);
      if (!project) throw new Error('Project not found.');
      project.defense[required(p.question, 300)] = required(p.answer, 5000);
      break;
    }
    case 'session.finish': {
      if (!p.task || typeof p.task !== 'object')
        throw new Error('Choose a focus task.');
      const task = taskFromPayload(p.task as Record<string, unknown>);
      const outcome = required(p.outcome, 20) as Session['outcome'];
      if (!['completed', 'progress', 'rest'].includes(outcome))
        throw new Error('Choose a session outcome.');
      const sid = required(p.id, 100);
      if (s.sessions.some((x) => x.id === sid)) return s;
      s.sessions.push({
        id: sid,
        task,
        date: now,
        seconds: num(p.seconds, 0, 64800),
        notes: str(p.notes, 10000),
        outcome,
        energy: num(p.energy, 0, 3) as Energy,
      });
      break;
    }
    case 'capture.add':
      s.captures.push({
        id: id(),
        text: required(p.text, 1000),
        date: now,
        done: false,
      });
      break;
    case 'capture.done': {
      const c = s.captures.find((c) => c.id === p.id);
      if (c) c.done = true;
      break;
    }
    case 'score.add': {
      const math = num(p.math, 200, 800),
        reading = num(p.reading, 200, 800);
      if (math % 10 || reading % 10)
        throw new Error('SAT section scores use increments of 10.');
      s.scores.push({
        id: id(),
        date: date(p.date),
        math,
        reading,
        source: required(p.source, 300),
      });
      s.scores.sort((a, b) => a.date.localeCompare(b.date));
      break;
    }
    case 'practice.add':
      s.practice.push({
        id: id(),
        date: date(p.date),
        topic: required(p.topic, 100),
        section: required(p.section, 50),
        questions: num(p.questions, 1, 1000),
        correct: num(p.correct, 0, num(p.questions, 1, 1000)),
        minutes: num(p.minutes, 0, 600),
      });
      break;
    case 'sat.session.start': {
      const sessionId = required(p.id, 100);
      if (s.satSessions.some((x) => x.id === sessionId)) return s;
      s.satSessions.push({
        id: sessionId,
        date: date(p.date || now.slice(0, 10)),
        section: satSection(p.section),
        topic: required(p.topic, 100),
        startedAt: now,
        seconds: 0,
        questions: [],
      });
      break;
    }
    case 'sat.question.add': {
      const session = s.satSessions.find((x) => x.id === p.sessionId);
      if (!session) throw new Error('Start an SAT practice session first.');
      if (session.completedAt)
        throw new Error('This SAT session is already complete.');
      const questionId = required(p.id, 100);
      if (session.questions.some((q) => q.id === questionId)) return s;
      const kind = required(p.kind, 30) as SatQuestionKind;
      if (kind !== 'multiple-choice' && kind !== 'open-response')
        throw new Error('Choose a question type.');
      const choices = choiceList(p.choices);
      if (kind === 'multiple-choice' && choices.length < 2)
        throw new Error('Add at least two answer choices.');
      const userAnswer = required(p.userAnswer, 1000),
        correctAnswer = required(p.correctAnswer, 1000),
        derived = answersEquivalent(userAnswer, correctAnswer);
      if (
        kind === 'multiple-choice' &&
        (!choices.some((choice) => choice.id === userAnswer) ||
          !choices.some((choice) => choice.id === correctAnswer))
      )
        throw new Error('Choose both answers from the saved choices.');
      if (
        p.correctnessOverride !== undefined &&
        typeof p.correctnessOverride !== 'boolean'
      )
        throw new Error('Invalid correctness override.');
      const correctness =
        typeof p.correctnessOverride === 'boolean'
          ? p.correctnessOverride
          : derived;
      const imageKey = str(p.imageKey || '', 200);
      if (imageKey && !/^[A-Za-z0-9_-]{20,100}\/[a-f0-9-]{36}$/.test(imageKey))
        throw new Error('Invalid question image.');
      if ('imageEssential' in p && typeof p.imageEssential !== 'boolean')
        throw new Error('Invalid image metadata.');
      const question: SatQuestion = {
        id: questionId,
        sessionId: session.id,
        kind,
        questionText: required(p.questionText, 10000),
        choices: kind === 'multiple-choice' ? choices : undefined,
        userAnswer,
        correctAnswer,
        correctness,
        correctnessOverride:
          typeof p.correctnessOverride === 'boolean'
            ? p.correctnessOverride
            : undefined,
        section: satSection(p.section),
        topic: required(p.topic, 100),
        difficulty: str(p.difficulty || '', 30) || undefined,
        source: str(p.source || '', 500) || undefined,
        sourceQuestionId: str(p.sourceQuestionId || '', 200) || undefined,
        imageKey: imageKey || undefined,
        imageEssential:
          typeof p.imageEssential === 'boolean' ? p.imageEssential : undefined,
        imageDescription: str(p.imageDescription || '', 1000) || undefined,
        createdAt: now,
      };
      if (!correctness) {
        const reason = required(p.reason, 100);
        if (!reasons.includes(reason))
          throw new Error('Choose what got in the way.');
        const mistakeId = id();
        s.mistakes.push({
          id: mistakeId,
          question: question.questionText,
          source:
            question.sourceQuestionId ||
            question.source ||
            'SAT practice session',
          section: question.section,
          topic: question.topic,
          difficulty: question.difficulty || 'Not set',
          answer: userAnswer,
          correct: correctAnswer,
          explanation: required(p.explanation, 5000),
          reason,
          status: 'Review again',
          due: now.slice(0, 10),
          interval: 0,
          card: initialCard(new Date(now).getTime()),
          reviews: [],
          satQuestionId: question.id,
          questionKind: question.kind,
          choices: question.choices,
          imageKey: question.imageKey,
          imageEssential: question.imageEssential,
          imageDescription: question.imageDescription,
        });
        question.mistakeId = mistakeId;
      }
      session.questions.push(question);
      break;
    }
    case 'sat.session.finish': {
      const session = s.satSessions.find((x) => x.id === p.id);
      if (!session) throw new Error('SAT practice session not found.');
      if (session.completedAt) return s;
      session.seconds = num(p.seconds, 0, 64800);
      session.completedAt = now;
      break;
    }
    case 'mistake.add': {
      const reason = required(p.reason, 100);
      if (!reasons.includes(reason))
        throw new Error('Choose what got in the way.');
      s.mistakes.push({
        id: id(),
        question: required(p.question, 5000),
        source: required(p.source, 500),
        section: satSection(p.section),
        topic: required(p.topic, 100),
        difficulty: required(p.difficulty, 30),
        answer: required(p.answer, 1000),
        correct: required(p.correct, 1000),
        explanation: required(p.explanation, 5000),
        reason,
        status: 'Review again',
        due: now.slice(0, 10),
        interval: 0,
        card: initialCard(new Date(now).getTime()),
        reviews: [],
      });
      break;
    }
    case 'mistake.review': {
      const m = s.mistakes.find((m) => m.id === p.id);
      if (!m) throw new Error('Mistake not found.');
      const status = required(p.status, 30) as Mistake['status'];
      if (!['Review again', 'Still unsure', 'Mastered'].includes(status))
        throw new Error('Choose a review result.');
      const result = nextReview(m.card, status, new Date(now).getTime());
      m.status = status;
      m.card = result.card;
      m.reviews = [...(m.reviews || []), result.log];
      m.interval = result.card.scheduled_days;
      m.due = new Date(result.card.due).toISOString().slice(0, 10);
      break;
    }
    case 'skill.update':
      s.skills[required(p.name, 80)] = {
        level: num(p.level, 0, 5),
        evidence: required(p.evidence, 3000),
        date: now,
      };
      break;
    case 'university.add':
      s.universities.push({
        id: id(),
        name: required(p.name, 150),
        program: required(p.program, 150),
        deadline: p.deadline ? date(p.deadline) : '',
        url: url(p.url),
        sat: str(p.sat || '', 300),
        aid: str(p.aid || '', 1000),
        status: 'Researching',
        requirements: [
          'Verify applicant eligibility',
          'Verify deadlines and testing policy',
          'Plan costs and financial aid',
          'Prepare transcript and academic records',
          'Plan essays and recommendations',
          'Document sustained activities',
        ].map((title) => ({ title, done: false })),
        notes: str(p.notes || '', 5000),
      });
      break;
    case 'university.update': {
      const u = s.universities.find((u) => u.id === p.id);
      if (!u) throw new Error('University not found.');
      if ('index' in p) {
        const i = num(p.index, 0, u.requirements.length - 1);
        u.requirements[i].done = !u.requirements[i].done;
      }
      if ('status' in p) {
        const status = required(p.status, 50);
        if (
          ![
            'Researching',
            'Preparing',
            'Ready to submit',
            'Submitted',
            'Decision received',
          ].includes(status)
        )
          throw new Error('Invalid application status.');
        u.status = status;
      }
      if ('notes' in p) u.notes = str(p.notes, 10000);
      break;
    }
    case 'plan.restart': {
      const areas = Array.isArray(p.areas)
        ? p.areas.filter((x) =>
            ['SAT', 'Engineering', 'University'].includes(String(x)),
          )
        : ['Engineering', 'SAT'];
      const tasks = recommendations(s, 0, 10).filter((t) =>
        areas.includes(t.area),
      );
      const first = tasks[0] || {
        title:
          'Open your notes and write one sentence about where you stopped.',
        area: String(areas[0] || 'Engineering'),
      };
      s.plan = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(new Date(now).getTime() + i * 86400000)
          .toISOString()
          .slice(0, 10),
        title:
          i === 0
            ? first.title
            : i === 1
              ? 'Continue with one small example'
              : i === 2 || i === 5
                ? 'Leave room for rest'
                : i === 3 && areas.includes('SAT')
                  ? 'Review three SAT questions'
                  : i === 6
                    ? 'Notice what moved forward this week'
                    : 'Return to your next small milestone',
        minutes: i === 2 || i === 5 ? 0 : i === 1 ? 20 : 10,
        area:
          i === 2 || i === 5
            ? 'Recovery'
            : String(i === 3 && areas.includes('SAT') ? 'SAT' : first.area),
      }));
      s.profile.energy = 0;
      s.profile.time = 10;
      break;
    }
    case 'reflection.add':
      s.reflections.push({ date: now, text: required(p.text, 10000) });
      break;
    default:
      throw new Error('This action is not supported.');
  }
  if (JSON.stringify(s).length > 1500000)
    throw new Error(
      'Your journal is large. Export a backup before adding more records.',
    );
  return s;
}
export function metrics(s: AppState, since = '') {
  const sessions = s.sessions.filter((x) => x.date >= since),
    structured = s.satSessions
      .filter((x) => x.startedAt >= since)
      .reduce((a, x) => a + x.questions.length, 0);
  return {
    minutes: Math.floor(sessions.reduce((a, x) => a + x.seconds, 0) / 60),
    sessions: sessions.length,
    questions:
      s.practice
        .filter((x) => x.date >= since)
        .reduce((a, x) => a + x.questions, 0) + structured,
    days: new Set(
      sessions.filter((x) => x.seconds > 0).map((x) => x.date.slice(0, 10)),
    ).size,
    milestones: s.projects
      .flatMap((p) => p.milestones)
      .filter((m) => m.done && (!since || (m.date || '') >= since)).length,
    skills: Object.values(s.skills).filter(
      (k) => k.level >= 4 && (!since || k.date >= since),
    ).length,
  };
}
export function satSessionStats(session: SatPracticeSession) {
  const attempted = session.questions.length,
    correct = session.questions.filter(
      (question) => question.correctness,
    ).length,
    incorrect = attempted - correct;
  return {
    attempted,
    correct,
    incorrect,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    mistakes: session.questions.filter((question) => question.mistakeId).length,
    minutes: Math.round(session.seconds / 60),
  };
}
export const defenseQuestions = [
  'Why did you choose this architecture?',
  'Why this language? What are the trade-offs?',
  'What happens if a node or process crashes?',
  'Could there be a race condition?',
  'Where is the bottleneck?',
  'How does memory usage scale?',
  'What happens during a network partition?',
  'How would this behave under 100× load?',
  'What security problems exist?',
  'What would you redesign?',
];
