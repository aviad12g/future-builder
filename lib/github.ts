import type { Repo } from './model';
import { ApiError, gh } from './server';

type GithubProfile = { login: string; avatar_url: string };

function decodeReadme(value: unknown) {
  if (typeof value !== 'string' || value.length > 100000) return '';
  try {
    const bytes = Uint8Array.from(atob(value.replace(/\n/g, '')), (character) =>
      character.charCodeAt(0),
    );
    return new TextDecoder().decode(bytes).slice(0, 12000);
  } catch {
    return '';
  }
}

async function inspectRepository(
  login: string,
  repository: any,
  token: string,
): Promise<Repo> {
  const base = `/repos/${encodeURIComponent(login)}/${encodeURIComponent(String(repository.name))}`;
  const results = await Promise.allSettled([
    gh(base + '/contents/', token),
    gh(base + '/languages', token),
    gh(base + '/readme', token),
    gh(base + '/commits?per_page=10', token),
    gh(base + '/pulls?state=all&per_page=10', token),
    gh(base + '/actions/runs?per_page=1', token),
    gh(base + '/releases/latest', token),
  ]);
  const value = (index: number, fallback: any) =>
    results[index].status === 'fulfilled' ? results[index].value : fallback;
  const files = value(0, []) as any[];
  const names = Array.isArray(files)
    ? files.map((file) => String(file.name).toLowerCase())
    : [];
  const readme = decodeReadme(value(2, {}).content);
  const languages = Object.keys(value(1, {}));
  const workflow = value(5, {}).workflow_runs?.[0];
  return {
    name: String(repository.name),
    url: String(repository.html_url),
    description: String(repository.description || ''),
    language: String(repository.language || 'Not detected'),
    languages,
    updated: String(repository.pushed_at || repository.updated_at || ''),
    commits: Array.isArray(value(3, [])) ? value(3, []).length : 0,
    issues: Number(repository.open_issues_count || 0),
    prs: Array.isArray(value(4, [])) ? value(4, []).length : 0,
    release: value(6, {}).tag_name || null,
    readme,
    ci: workflow?.conclusion || workflow?.status || 'Not available',
    readiness: {
      README: names.some((name) => name.startsWith('readme')),
      Architecture: /architecture|design|diagram/i.test(readme),
      Setup: /install|getting.started|setup/i.test(readme),
      Tests:
        names.some((name) => /^(test|tests|__tests__|spec)$/.test(name)) ||
        /testing|npm test|cargo test|go test/i.test(readme),
      CI: Number(value(5, {}).total_count || 0) > 0,
      Benchmarks: /benchmark|latency|throughput/i.test(readme),
      'Engineering decisions': /trade.?off|decision|alternative/i.test(readme),
      'Security considerations': /security|threat.model|trust.boundar/i.test(
        readme,
      ),
    },
  };
}

export async function fetchGithubPortfolio(token: string, limit = 20) {
  const profile = (await gh('/user', token)) as GithubProfile;
  if (!profile?.login)
    throw new ApiError('GitHub did not return an account identity.', 502);
  const response = (await gh(
    `/users/${encodeURIComponent(profile.login)}/repos?type=owner&sort=pushed&direction=desc&per_page=30`,
    token,
  )) as any[];
  if (!Array.isArray(response))
    throw new ApiError('GitHub returned an invalid repository list.', 502);
  const owned = response
    .filter(
      (repository) =>
        repository?.owner?.login === profile.login &&
        repository.private === false,
    )
    .slice(0, Math.min(20, Math.max(1, limit)));
  const repos: Repo[] = [];
  for (const repository of owned)
    repos.push(await inspectRepository(profile.login, repository, token));
  return { login: profile.login, avatar: profile.avatar_url || '', repos };
}
