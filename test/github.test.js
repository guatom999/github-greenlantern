import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContributionHtml, fetchContributions } from '../src/github.js';

const html = `<table><td data-level='4' id='d' data-date='2026-10-24'></td><td data-date="2026-10-23" data-level="0"></td></table>`;
const payload = { data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: [{ date: '2026-10-24', weekday: 6, contributionCount: 7, contributionLevel: 'FOURTH_QUARTILE' }] }] } } } } };

test('parses contribution attributes in either order and quote style', () => {
  assert.deepEqual(parseContributionHtml(html), [{ date: '2026-10-24', level: 4 }, { date: '2026-10-23', level: 0 }]);
  assert.throws(() => parseContributionHtml('<html>Sign in</html>'), /no contribution/i);
  assert.throws(() => parseContributionHtml('<td data-date="2026-10-24" data-level="8"></td>'), /level/i);
});

test('fetches public levels without sending credentials', async () => {
  const result = await fetchContributions('guatom999', { fetchImpl: async (url, options) => {
    assert.equal(url, 'https://github.com/users/guatom999/contributions');
    assert.equal(options.headers.Authorization, undefined);
    return new Response(html);
  } });
  assert.equal(result.source, 'github-public');
  assert.equal(result.days.length, 2);
});

test('uses GraphQL and preserves count and intensity with a token', async () => {
  const result = await fetchContributions('guatom999', { token: 'secret-value', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.github.com/graphql');
    assert.equal(options.headers.Authorization, 'Bearer secret-value');
    assert.equal(JSON.parse(options.body).variables.login, 'guatom999');
    return Response.json(payload);
  } });
  assert.equal(result.source, 'github-graphql');
  assert.deepEqual(result.days, [{ date: '2026-10-24', level: 4, count: 7 }]);
});

test('validates usernames before making any network request', async () => {
  for (const name of ['', '-bad', 'bad-', 'bad--name', 'bad/name', 'a'.repeat(40), '<script>']) {
    await assert.rejects(fetchContributions(name, { fetchImpl: () => { throw new Error('request must not run'); } }), /username/i);
  }
});

test('reports HTTP errors without disclosing a token or server body', async () => {
  for (const status of [401, 404, 429, 503]) {
    await assert.rejects(fetchContributions('demo', { token: 'private-token', fetchImpl: async () => new Response('private-token server body', { status }) }), error => error.message.includes(String(status)) && !error.message.includes('private-token'));
  }
});

test('rejects GraphQL errors, missing users, malformed JSON and data', async () => {
  for (const body of [{ errors: [{ message: 'private-token' }] }, { data: { user: null } }, { data: {} }, {}, { data: { user: { contributionsCollection: { contributionCalendar: { weeks: [] } } } } }]) {
    await assert.rejects(fetchContributions('demo', { token: 'private-token', fetchImpl: async () => Response.json(body) }), error => !error.message.includes('private-token') && /GitHub|user|calendar|GraphQL/i.test(error.message));
  }
  await assert.rejects(fetchContributions('demo', { token: 'x', fetchImpl: async () => new Response('not json') }), /JSON|response/i);
  const invalid = structuredClone(payload);
  invalid.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionLevel = 'MYSTERY';
  await assert.rejects(fetchContributions('demo', { token: 'x', fetchImpl: async () => Response.json(invalid) }), /level|calendar/i);
});

test('turns fetch errors and timeouts into safe actionable errors', async () => {
  await assert.rejects(fetchContributions('demo', { token: 'secret-value', fetchImpl: async () => { throw new Error('secret-value'); } }), error => /network/i.test(error.message) && !error.message.includes('secret-value'));
  await assert.rejects(fetchContributions('demo', { timeoutMs: 15, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(signal.reason), { once: true }); }) }), /timed out/i);
});
