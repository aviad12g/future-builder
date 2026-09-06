'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  BookOpen,
  Bookmark,
  Check,
  Code2,
  Copy,
  GraduationCap,
  Library,
  Play,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useApp, PageHeading, Empty, External, Choice } from './shared';
export type Resource = {
  id: string;
  name: string;
  provider: string;
  category: string;
  kind: string;
  mark: string;
  color: string;
  description: string;
  url: string;
  step: string;
  minutes: number;
  tags: string[];
  access: string;
};
export const resources: Resource[] = [
  {
    id: 'khan',
    name: 'Khan Academy',
    provider: 'Official SAT practice',
    category: 'SAT',
    kind: 'Practice',
    mark: 'K',
    color: 'mint',
    description:
      'Build confidence one skill at a time, with lessons and questions for both SAT sections.',
    url: 'https://www.khanacademy.org/digital-sat',
    step: 'Choose one weak SAT skill. Try three questions and explain one mistake.',
    minutes: 15,
    tags: ['Math', 'Reading & Writing', 'Algebra'],
    access: 'Free',
  },
  {
    id: 'bluebook',
    name: 'Bluebook',
    provider: 'College Board',
    category: 'SAT',
    kind: 'Practice test',
    mark: 'B',
    color: 'blue',
    description:
      'Practice in the official digital test environment. Record your section scores here afterward.',
    url: 'https://bluebook.collegeboard.org/students/practice',
    step: 'Open Bluebook and try the test preview. Schedule a full practice test for a higher-energy day.',
    minutes: 15,
    tags: ['Official', 'Test familiarity'],
    access: 'Free · account needed',
  },
  {
    id: 'questionbank',
    name: 'Student Question Bank',
    provider: 'College Board · My Practice',
    category: 'SAT',
    kind: 'Question bank',
    mark: 'Q',
    color: 'peach',
    description:
      'Find official practice questions and review the reasoning behind the answers.',
    url: 'https://satsuite.collegeboard.org/practice',
    step: 'Open My Practice from the official practice page. Choose a small set for your weakest topic.',
    minutes: 20,
    tags: ['Official', 'Targeted review'],
    access: 'Free · account may be needed',
  },
  {
    id: 'schoolhouse',
    name: 'Schoolhouse.world',
    provider: 'Peer learning, together',
    category: 'SAT',
    kind: 'Live tutoring',
    mark: 's.',
    color: 'rose',
    description:
      'Explore SAT bootcamps and focus sessions when learning with someone would help.',
    url: 'https://schoolhouse.world/sat-bootcamp',
    step: 'Look at one SAT focus session. Check its timing and learner requirements.',
    minutes: 10,
    tags: ['Community', 'Tutoring'],
    access: 'Free · registration needed',
  },
  {
    id: 'gemini',
    name: 'Gemini SAT practice',
    provider: 'Google × Princeton Review',
    category: 'SAT',
    kind: 'Interactive practice',
    mark: '✦',
    color: 'blue',
    description:
      'Explore full-length or section practice in Gemini, grounded in Princeton Review content. Use the feedback to find your next study topic.',
    url: 'https://blog.google/innovation-and-ai/products/gemini-app/how-to-take-practice-sat/',
    step: 'Open the guide and launch a practice section in Gemini. Review two errors, then log what you learned.',
    minutes: 15,
    tags: ['SAT', 'Concepts', 'Socratic practice'],
    access: 'Free SAT practice · sign-in needed',
  },
  {
    id: 'gemini-guided',
    name: 'Gemini Guided Learning',
    provider: 'Google',
    category: 'AI companions',
    kind: 'Socratic tutoring',
    mark: '✦',
    color: 'blue',
    description:
      'Ask for hints and a different explanation. Check your reasoning one question at a time.',
    url: 'https://support.google.com/gemini/answer/16448384?hl=en',
    step: 'Ask for one guided question about a concept you find confusing. Explain your answer before requesting a hint.',
    minutes: 15,
    tags: ['Concepts', 'SAT', 'Reasoning'],
    access: 'Account needed · availability varies',
  },
  {
    id: 'notebook',
    name: 'NotebookLM / Gemini Notebook',
    provider: 'Google · source-based study',
    category: 'AI companions',
    kind: 'Notes & quizzes',
    mark: 'N',
    color: 'violet',
    description:
      'Use your own permitted readings and error notes to create source-grounded quizzes and explanations.',
    url: 'https://support.google.com/gemininotebook/answer/16164461?hl=en',
    step: 'Add your own error notes and one permitted reading. Create a short quiz and verify one explanation against its source.',
    minutes: 20,
    tags: ['Retrieval practice', 'Your sources'],
    access: 'Account needed · usage limits apply',
  },
  {
    id: 'docker',
    name: 'Docker, from the beginning',
    provider: 'Official Docker documentation',
    category: 'Cloud',
    kind: 'Practical guide',
    mark: 'D',
    color: 'blue',
    description:
      'Understand the difference between an image, a running container, and the application inside it.',
    url: 'https://docs.docker.com/get-started/introduction/',
    step: 'Read the container introduction. Sketch how an application, image, and running container differ.',
    minutes: 15,
    tags: ['Docker', 'Containers', 'Infrastructure'],
    access: 'Free documentation',
  },
  {
    id: 'aws-educate',
    name: 'AWS Educate',
    provider: 'Amazon Web Services',
    category: 'Cloud',
    kind: 'Guided learning & labs',
    mark: 'aws',
    color: 'peach',
    description:
      'Explore beginner cloud concepts through structured courses and hands-on learning.',
    url: 'https://aws.amazon.com/education/awseducate/',
    step: 'Review the Getting Started with Storage learning path. Try one short lesson inside Educate.',
    minutes: 15,
    tags: ['Cloud', 'Storage', 'Infrastructure'],
    access: 'Free · registration needed',
  },
  {
    id: 'ml-crash',
    name: 'Machine Learning Crash Course',
    provider: 'Google for Developers',
    category: 'AI & science',
    kind: 'Interactive course',
    mark: 'ML',
    color: 'mint',
    description:
      'Build intuition for regression, classification, data, and practical machine-learning systems.',
    url: 'https://developers.google.com/machine-learning/crash-course/',
    step: 'Explore linear regression. Describe how changing a line’s slope changes its predictions.',
    minutes: 15,
    tags: ['Machine learning', 'Python', 'Fundamentals'],
    access: 'Free materials · prerequisites apply',
  },
  {
    id: 'ostep',
    name: 'Three Easy Pieces',
    provider: 'University of Wisconsin–Madison',
    category: 'Systems',
    kind: 'Open textbook',
    mark: 'OS',
    color: 'violet',
    description:
      'Explore virtualization, concurrency, and persistence in the operating systems behind your code.',
    url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    step: 'Read one section about processes or memory. Draw a small example in your engineering notes.',
    minutes: 20,
    tags: ['Linux', 'Processes', 'Memory', 'Concurrency'],
    access: 'Free online chapters',
  },
  {
    id: 'beej',
    name: 'Beej’s Network Guide',
    provider: 'Brian “Beej” Hall',
    category: 'Systems',
    kind: 'Practical guide',
    mark: 'B/',
    color: 'mint',
    description:
      'Make sockets and network programming feel concrete, from a simple connection upward.',
    url: 'https://beej.us/guide/bgnet/html/',
    step: 'Find the client/server example. Trace the order of socket calls and explain why each is needed.',
    minutes: 20,
    tags: ['TCP/IP', 'Networking', 'C'],
    access: 'Free',
  },
  {
    id: 'missing',
    name: 'The Missing Semester',
    provider: 'MIT CSAIL',
    category: 'Systems',
    kind: 'Course',
    mark: '>_',
    color: 'peach',
    description:
      'Get comfortable with the shell, tools, and workflows that make engineering feel less mysterious.',
    url: 'https://missing.csail.mit.edu/',
    step: 'Choose one shell exercise. Run it locally, then write down what changed.',
    minutes: 20,
    tags: ['Linux', 'Git', 'Developer tools'],
    access: 'Free',
  },
  {
    id: 'mit',
    name: 'Introduction to Algorithms',
    provider: 'MIT OpenCourseWare · 6.006',
    category: 'Computer science',
    kind: 'University course',
    mark: 'MIT',
    color: 'rose',
    description:
      'Learn to reason about data structures, algorithms, correctness, and efficiency.',
    url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
    step: 'Watch a short part of the first lecture. Explain one algorithm and its running time in your own words.',
    minutes: 25,
    tags: ['Algorithms', 'Data structures'],
    access: 'Free course materials',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes tutorials',
    provider: 'Official documentation',
    category: 'Cloud',
    kind: 'Hands-on lab',
    mark: 'K8',
    color: 'blue',
    description:
      'Connect deployments, services, and configuration to a small reproducible infrastructure lab.',
    url: 'https://kubernetes.io/docs/tutorials/',
    step: 'Open Kubernetes Basics. Trace how a deployment and a service fit together before running a local example.',
    minutes: 25,
    tags: ['Kubernetes', 'Docker', 'Infrastructure'],
    access: 'Free docs · use local tools',
  },
  {
    id: 'fastai',
    name: 'Practical Deep Learning',
    provider: 'fast.ai',
    category: 'AI & science',
    kind: 'Course',
    mark: 'f.ai',
    color: 'peach',
    description:
      'Build practical machine-learning understanding with code and experiments you can inspect.',
    url: 'https://course.fast.ai/',
    step: 'Open lesson one. Record the data, model, and evaluation steps in the first example.',
    minutes: 25,
    tags: ['Python', 'PyTorch', 'Machine learning'],
    access: 'Free course · compute optional',
  },
  {
    id: 'rdkit',
    name: 'RDKit in Python',
    provider: 'Official RDKit documentation',
    category: 'AI & science',
    kind: 'Scientific toolkit',
    mark: 'R',
    color: 'mint',
    description:
      'Turn chemical structures into code through molecules, fingerprints, and similarity.',
    url: 'https://www.rdkit.org/docs/GettingStartedInPython.html',
    step: 'Read the first molecule example. Explain what a SMILES string represents and what validation is needed.',
    minutes: 20,
    tags: ['Chemistry', 'Python', 'Molecules'],
    access: 'Free documentation',
  },
  {
    id: 'chemistry',
    name: 'Chemistry 2e',
    provider: 'OpenStax',
    category: 'AI & science',
    kind: 'Open textbook',
    mark: 'C₂',
    color: 'violet',
    description:
      'Keep the scientific fundamentals close while exploring chemistry through computing.',
    url: 'https://openstax.org/books/chemistry-2e/pages/preface',
    step: 'Choose one concept relevant to a molecular project and make a short note with an example.',
    minutes: 15,
    tags: ['Chemistry', 'Fundamentals'],
    access: 'Free online textbook',
  },
  {
    id: 'open-source',
    name: 'Open Source Guides',
    provider: 'GitHub',
    category: 'Opportunities',
    kind: 'Contribution guide',
    mark: '↗',
    color: 'violet',
    description:
      'Find a thoughtful first contribution and learn how to work well with a project’s community.',
    url: 'https://opensource.guide/',
    step: 'Read the contribution guide. Find one project you already use and inspect its CONTRIBUTING file.',
    minutes: 20,
    tags: ['Open source', 'Collaboration', 'Git'],
    access: 'Free',
  },
  {
    id: 'mlh',
    name: 'Major League Hacking',
    provider: 'MLH',
    category: 'Opportunities',
    kind: 'Events & community',
    mark: 'mlh',
    color: 'rose',
    description:
      'Explore hackathons and developer programs that fit your interests and available energy.',
    url: 'https://www.mlh.com/',
    step: 'Review one event. Record eligibility, location, time commitment, and an idea you care about.',
    minutes: 15,
    tags: ['Hackathons', 'Community'],
    access: 'Requirements and costs vary',
  },
  {
    id: 'educationusa',
    name: 'Your 5 Steps to U.S. Study',
    provider: 'EducationUSA',
    category: 'University',
    kind: 'Official planning guide',
    mark: 'U',
    color: 'blue',
    description:
      'Work through research, funding, applications, and preparation as an international applicant.',
    url: 'https://educationusa.state.gov/your-5-steps-us-study',
    step: 'Read the first step. Write down one eligibility or cost question to verify with a university.',
    minutes: 15,
    tags: ['International applicants', 'Planning'],
    access: 'Free guidance',
  },
];
const prompts = [
  {
    name: 'SAT · help me reason',
    text: 'Act as a patient SAT study companion. I will paste a practice question and my attempt. First ask what I tried, then give only one small hint at a time. Help me explain why the correct answer works and why mine did not. Do not claim an official SAT score. Check any solution against the official explanation I provide. Finish with one similar original practice question, clearly labeled as AI-generated.',
  },
  {
    name: 'Engineering · unblock one concept',
    text: 'Help me understand one engineering concept for my project. Ask what I already understand and what I am building. Use one small concrete example. Ask me to predict its behavior before explaining it. Help me design one test. Do not implement the whole project for me. Distinguish facts from assumptions and point me to primary documentation to verify details.',
  },
  {
    name: 'Project · defend my decisions',
    text: 'Act as a thoughtful engineering reviewer. I will share my architecture notes. Ask one question at a time about trade-offs, failure behavior, concurrency, memory, security boundaries, and performance. Wait for my answer, then challenge unclear reasoning. Turn each gap into one small learning task. Do not infer understanding from libraries I used.',
  },
];
export function ResourceStrip({ category }: { category: string }) {
  const { navigate } = useApp();
  const items = resources.filter((r) => r.category === category).slice(0, 2);
  return (
    <section className="resource-strip">
      <div>
        <span className="shelf-icon">
          <Library size={18} />
        </span>
        <div>
          A little help along the way
          <small>Good resources, right when you need them.</small>
        </div>
      </div>
      <div>
        {items.map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer">
            <span className={'mini-mark ' + r.color}>{r.mark}</span>
            {r.name}
            <ArrowUpRight size={13} />
          </a>
        ))}
        <button
          aria-label="Explore learning library"
          onClick={() => navigate('resources')}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
export function ResourcesView() {
  const { state, send, notify, start } = useApp();
  const [category, setCategory] = useState('All'),
    [query, setQuery] = useState(''),
    [prompt, setPrompt] = useState(0),
    [savedOnly, setSavedOnly] = useState(false);
  const saved = (id: string) =>
    state.captures.some(
      (c) => c.text.startsWith('[Resource:' + id + ']') && !c.done,
    );
  const list = resources.filter(
    (r) =>
      (category === 'All' || r.category === category) &&
      (r.name + ' ' + r.description + ' ' + r.tags.join(' '))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!savedOnly || saved(r.id)),
  );
  return (
    <>
      <PageHeading
        eyebrow="A CURATED CORNER OF THE INTERNET"
        title="Stay curious. Go deeper."
        subtitle="The right resource can make a hard thing feel possible."
      />
      <section className="library-feature">
        <div>
          <span className="tag mint-text">START WITH A SMALL QUESTION</span>
          <h2>
            Good teachers.
            <br />
            <em>Open doors.</em>
          </h2>
          <p>
            Official practice, thoughtful courses, and a little help when you’re
            stuck. Pick what serves your next step.
          </p>
        </div>
        <div
          className="library-spines"
          aria-label="Learning collection: SAT, systems, AI, and university"
        >
          <button
            className="spine mint"
            onClick={() => setCategory('SAT')}
            aria-label="Explore SAT resources"
          >
            SAT<span>01</span>
          </button>
          <button
            className="spine violet"
            onClick={() => setCategory('Systems')}
            aria-label="Explore systems resources"
          >
            SYSTEMS<span>02</span>
          </button>
          <button
            className="spine peach"
            onClick={() => setCategory('AI & science')}
            aria-label="Explore AI and science resources"
          >
            AI + SCIENCE<span>03</span>
          </button>
          <button
            className="spine blue"
            onClick={() => setCategory('University')}
            aria-label="Explore university resources"
          >
            YOUR FUTURE<span>04</span>
          </button>
        </div>
      </section>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Find a learning resource"
            placeholder="Find a topic, skill, or resource…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Choice
          label="Resource category"
          options={[
            'All',
            ...Array.from(new Set(resources.map((r) => r.category))),
          ]}
          value={category}
          onChange={setCategory}
        />
        <button
          className={'quiet-button ' + (savedOnly ? 'selected' : '')}
          onClick={() => setSavedOnly(!savedOnly)}
        >
          <Bookmark size={15} />
          {savedOnly ? 'Saved resources' : 'Your shelf'}
        </button>
      </div>
      <div className="resource-grid">
        {list.map((r) => (
          <article className={'resource-card tint-' + r.color} key={r.id}>
            <div className="section-title">
              <span className={'resource-mark ' + r.color}>{r.mark}</span>
              <button
                className={'icon-button ' + (saved(r.id) ? 'bookmarked' : '')}
                aria-label={
                  saved(r.id) ? r.name + ' is saved' : 'Save ' + r.name
                }
                disabled={saved(r.id)}
                onClick={() =>
                  void send({
                    type: 'capture.add',
                    payload: {
                      text: `[Resource:${r.id}] ${r.name} — ${r.url}`,
                    },
                  })
                    .then(() => notify('Added to your learning shelf.'))
                    .catch(() => {})
                }
              >
                {saved(r.id) ? <Check size={17} /> : <Bookmark size={17} />}
              </button>
            </div>
            <div className="resource-kicker">
              {r.category} <span>·</span> {r.kind}
            </div>
            <h3>{r.name}</h3>
            <span className="resource-provider">{r.provider}</span>
            <p>{r.description}</p>
            <div className="chips">
              {r.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="resource-actions">
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                Explore resource
                <ArrowUpRight size={16} />
              </a>
              <button
                aria-label={
                  'Start a ' + r.minutes + ' minute session with ' + r.name
                }
                onClick={() =>
                  start({
                    kind: 'generic',
                    id: 'resource:' + r.id,
                    title: r.step,
                    why:
                      'Use ' +
                      r.name +
                      ' to deepen one idea. ' +
                      r.access +
                      '. Open the resource first, then return here to focus.',
                    minutes: r.minutes,
                    area:
                      r.category === 'SAT'
                        ? 'SAT'
                        : r.category === 'University'
                          ? 'University'
                          : 'Engineering',
                    skills: r.tags,
                    step: r.step,
                  })
                }
              >
                <Play size={14} />
                {r.minutes}m
              </button>
            </div>
            <small className="resource-access">{r.access}</small>
          </article>
        ))}
      </div>
      {!list.length && (
        <Empty
          title="Nothing on this shelf yet."
          text="Try a different topic or save a resource that makes you curious."
        />
      )}
      <section className="study-companion">
        <div className="companion-intro">
          <span className="companion-symbol">
            <Sparkles size={25} />
          </span>
          <div className="eyebrow">A THOUGHTFUL STUDY COMPANION</div>
          <h2>
            A better question.
            <br />
            <em>A deeper understanding.</em>
          </h2>
          <p>
            Take a guided prompt to Gemini. Ask for hints, explain your
            reasoning, and verify answers with the official source.
          </p>
          <External href="https://gemini.google/cm/students/?hl=en-GB">
            Explore Gemini for learning
          </External>
        </div>
        <div className="prompt-card">
          <Choice
            label="Choose a study prompt"
            value={prompts[prompt].name}
            options={prompts.map((p) => p.name)}
            onChange={(v) => setPrompt(prompts.findIndex((p) => p.name === v))}
          />
          <p>{prompts[prompt].text}</p>
          <button
            className="primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(prompts[prompt].text);
                notify('Prompt copied. Paste it into your study companion.');
              } catch {
                notify(
                  'Clipboard is unavailable. Select and copy the prompt text.',
                  true,
                );
              }
            }}
          >
            <Copy size={16} />
            Copy study prompt
          </button>
          <small>
            AI may make mistakes. Scores and mastery come from verified work.
            Nothing is sent automatically.
          </small>
        </div>
      </section>
      <p className="source-note">
        Resources checked against provider pages on September 6, 2026. External
        accounts, availability, and pricing may change. Links open in a new tab.
      </p>
    </>
  );
}
