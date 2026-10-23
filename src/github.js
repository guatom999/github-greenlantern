import { normalizeDays } from './calendar.js';

export function validateUsername(username) {
  if (typeof username !== 'string' || username.length > 39 || !/^[a-z\d]+(?:-[a-z\d]+)*$/i.test(username)) {
    throw new Error('Invalid GitHub username: use 1–39 letters/digits, with single hyphens between groups.');
  }
  return username;
}

/** Public contribution cells: attribute order and quote style are not significant. */
export function parseContributionHtml(html) {
  if (typeof html !== 'string') throw new Error('Invalid GitHub HTML response.');
  const days = [];
  for (const [tag] of html.matchAll(/<[^>]+>/g)) {
    const attributes = Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(match => [match[1].toLowerCase(), match[2] ?? match[3]]));
    if (attributes['data-date'] === undefined || attributes['data-level'] === undefined) continue;
    const level = attributes['data-level'];
    if (!/^[0-4]$/.test(level)) throw new Error('Invalid contribution level in the GitHub public calendar.');
    days.push({ date: attributes['data-date'], level: Number(level) });
  }
  if (days.length === 0) throw new Error('No contribution cells found. Check the username, or use GITHUB_TOKEN if GitHub changed its public page.');
  normalizeDays(days);
  return days;
}

const QUERY = `query ContributionCalendar($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

function graphDays(body) {
  if (body.errors?.length) throw new Error('GitHub GraphQL rejected the request. Check token access and API rate limits.');
  if (body.data?.user === null) throw new Error('GitHub user not found. Check the username.');
  const weeks = body.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks)) throw new Error('GitHub returned an invalid calendar response.');
  const days = weeks.flatMap(week => {
    if (!Array.isArray(week?.contributionDays)) throw new Error('GitHub returned invalid calendar weeks.');
    return week.contributionDays.map(day => {
      if (!day || !Object.hasOwn(LEVELS, day.contributionLevel)) throw new Error('GitHub returned an unknown contribution level.');
      return { date: day.date, level: LEVELS[day.contributionLevel], count: day.contributionCount };
    });
  });
  normalizeDays(days);
  return days;
}

/** Token is used only for GitHub GraphQL; errors never include response bodies. */
export async function fetchContributions(username, { token, fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = {}) {
  validateUsername(username);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Request timeout must be a positive number.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const graphql = Boolean(token);
  const url = graphql ? 'https://api.github.com/graphql' : `https://github.com/users/${username}/contributions`;
  const headers = { 'User-Agent': 'github-greenlantern', Accept: graphql ? 'application/json' : 'text/html' };
  if (graphql) { headers.Authorization = `Bearer ${token}`; headers['Content-Type'] = 'application/json'; }
  try {
    let response;
    try {
      response = await fetchImpl(url, { method: graphql ? 'POST' : 'GET', headers, signal: controller.signal, ...(graphql ? { body: JSON.stringify({ query: QUERY, variables: { login: username } }) } : {}) });
    } catch {
      if (controller.signal.aborted) throw new Error('GitHub request timed out. Try again or check your network.');
      throw new Error('GitHub network request failed. Check your connection and try again.');
    }
    if (!response.ok) {
      const advice = response.status === 404 ? 'Check the username.' : response.status === 401 ? 'Check GITHUB_TOKEN.' : response.status === 429 || response.status === 403 ? 'Check API limits or try later.' : 'Try again later.';
      throw new Error(`GitHub HTTP ${response.status}. ${advice}`);
    }
    let content;
    try { content = graphql ? await response.json() : await response.text(); }
    catch {
      if (controller.signal.aborted) throw new Error('GitHub request timed out while reading the response.');
      throw new Error('GitHub returned an unreadable response (expected JSON or HTML).');
    }
    if (graphql && (!content || typeof content !== 'object')) throw new Error('GitHub returned an invalid JSON response.');
    return { days: graphql ? graphDays(content) : parseContributionHtml(content), source: graphql ? 'github-graphql' : 'github-public' };
  } finally { clearTimeout(timer); }
}
