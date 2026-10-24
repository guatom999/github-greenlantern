import { normalizeDays } from './calendar.js';
import { isContributionLevel, isRecord } from './validation.js';
import type {
  ContributionDay,
  ContributionLevel,
  ContributionRequestOptions,
  ContributionResult,
  FetchContributionsOptions,
} from './types.js';

export function validateUsername(username: unknown): string {
  if (typeof username !== 'string' || username.length > 39 || !/^[a-z\d]+(?:-[a-z\d]+)*$/i.test(username)) {
    throw new Error('Invalid GitHub username: use 1–39 letters/digits, with single hyphens between groups.');
  }
  return username;
}

function parseHtmlAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3];
    attributes[name] = value;
  }

  return attributes;
}

/** Public contribution cells: attribute order and quote style are not significant. */
export function parseContributionHtml(html: unknown): ContributionDay[] {
  if (typeof html !== 'string') {
    throw new Error('Invalid GitHub HTML response.');
  }

  const days: ContributionDay[] = [];
  for (const [tag] of html.matchAll(/<[^>]+>/g)) {
    const attributes = parseHtmlAttributes(tag);
    if (attributes['data-date'] === undefined || attributes['data-level'] === undefined) {
      continue;
    }

    const levelText = attributes['data-level'];
    const level = Number(levelText);
    if (!/^[0-4]$/.test(levelText) || !isContributionLevel(level)) {
      throw new Error('Invalid contribution level in the GitHub public calendar.');
    }

    days.push({ date: attributes['data-date'], level });
  }
  if (days.length === 0) {
    throw new Error('No contribution cells found. Check the username, or use GITHUB_TOKEN if GitHub changed its public page.');
  }

  normalizeDays(days);
  return days;
}

const QUERY = `query ContributionCalendar($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}`;
const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function parseGraphQlDays(body: Record<string, unknown>): ContributionDay[] {
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw new Error('GitHub GraphQL rejected the request. Check token access and API rate limits.');
  }
  const user = isRecord(body.data) ? body.data.user : undefined;
  if (user === null) {
    throw new Error('GitHub user not found. Check the username.');
  }

  const collection = isRecord(user) ? user.contributionsCollection : undefined;
  const calendar = isRecord(collection) ? collection.contributionCalendar : undefined;
  const weeks = isRecord(calendar) ? calendar.weeks : undefined;
  if (!Array.isArray(weeks)) {
    throw new Error('GitHub returned an invalid calendar response.');
  }

  const days = weeks.flatMap((week: unknown): ContributionDay[] => {
    if (!isRecord(week) || !Array.isArray(week.contributionDays)) {
      throw new Error('GitHub returned invalid calendar weeks.');
    }

    return week.contributionDays.map((day: unknown): ContributionDay => {
      if (!isRecord(day) || typeof day.contributionLevel !== 'string'
        || !Object.hasOwn(LEVELS, day.contributionLevel)) {
        throw new Error('GitHub returned an unknown contribution level.');
      }

      const { date, contributionCount: count } = day;
      if (typeof date !== 'string') {
        throw new Error('GitHub returned an invalid calendar date.');
      }
      if (count !== undefined && (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)) {
        throw new Error('GitHub returned an invalid contribution count.');
      }

      return {
        date,
        level: LEVELS[day.contributionLevel],
        ...(count !== undefined ? { count } : {}),
      };
    });
  });

  normalizeDays(days);
  return days;
}

/** Token is used only for GitHub GraphQL; errors never include response bodies. */
export async function fetchContributions(
  username: string,
  options: FetchContributionsOptions = {},
): Promise<ContributionResult> {
  const { token, fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = options;
  validateUsername(username);

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Request timeout must be a positive number.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const useGraphQl = Boolean(token);
  const request = createRequest(username, token, controller.signal);

  try {
    let response: Response;
    try {
      response = await fetchImpl(request.url, request.options);
    } catch {
      if (controller.signal.aborted) {
        throw new Error('GitHub request timed out. Try again or check your network.');
      }
      throw new Error('GitHub network request failed. Check your connection and try again.');
    }

    if (!response.ok) {
      const advice = httpErrorAdvice(response.status);
      throw new Error(`GitHub HTTP ${response.status}. ${advice}`);
    }

    let content: unknown;
    try {
      content = useGraphQl ? await response.json() : await response.text();
    } catch {
      if (controller.signal.aborted) {
        throw new Error('GitHub request timed out while reading the response.');
      }
      throw new Error('GitHub returned an unreadable response (expected JSON or HTML).');
    }

    let days: ContributionDay[];
    if (useGraphQl) {
      if (!isRecord(content)) {
        throw new Error('GitHub returned an invalid JSON response.');
      }
      days = parseGraphQlDays(content);
    } else {
      days = parseContributionHtml(content);
    }

    return {
      days,
      source: useGraphQl ? 'github-graphql' : 'github-public',
    };
  } finally {
    clearTimeout(timer);
  }
}

function createRequest(username: string, token: string | undefined, signal: AbortSignal): {
  url: string;
  options: ContributionRequestOptions;
} {
  const useGraphQl = Boolean(token);
  const url = useGraphQl
    ? 'https://api.github.com/graphql'
    : `https://github.com/users/${username}/contributions`;
  const headers: Record<string, string> = {
    'User-Agent': 'github-greenlantern',
    Accept: useGraphQl ? 'application/json' : 'text/html',
  };
  const options: ContributionRequestOptions = {
    method: useGraphQl ? 'POST' : 'GET',
    headers,
    signal,
  };

  if (useGraphQl) {
    headers.Authorization = `Bearer ${token}`;
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({ query: QUERY, variables: { login: username } });
  }

  return { url, options };
}

function httpErrorAdvice(status: number): string {
  switch (status) {
    case 404:
      return 'Check the username.';
    case 401:
      return 'Check GITHUB_TOKEN.';
    case 429:
    case 403:
      return 'Check API limits or try later.';
    default:
      return 'Try again later.';
  }
}
