// Read-only client for the public GitHub REST API.
// Requests run one at a time per rate-limit bucket, and wait out a short limit instead of failing.

const API = "https://api.github.com";
const MAX_WAIT_MS = 65_000;

export class GitHubError extends Error {
  constructor(kind, message, details = {}) {
    super(message);
    this.name = "GitHubError";
    this.kind = kind;
    Object.assign(this, details);
  }
}

export function createGitHub({
  token = "",
  fetchImpl = (...args) => fetch(...args),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
  onWait = () => {},
} = {}) {
  const limits = new Map();
  const queues = new Map();

  function remember(response, bucket) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    if (remaining === null || reset === null) return;
    limits.set(response.headers.get("x-ratelimit-resource") || bucket, {
      remaining: Number(remaining),
      reset: Number(reset),
    });
  }

  function limitError(bucket) {
    return new GitHubError("rate-limit", `GitHub ${bucket} rate limit reached`, {
      bucket,
      reset: limits.get(bucket)?.reset || 0,
      authenticated: Boolean(token),
    });
  }

  async function waitUntil(resetSeconds, bucket) {
    const ms = resetSeconds * 1000 - now() + 1000;
    if (ms <= 0) return;
    if (ms > MAX_WAIT_MS) throw limitError(bucket);
    onWait(Math.ceil(ms / 1000));
    await sleep(ms);
  }

  async function send(path, params, bucket) {
    const url = new URL(path, API);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }

    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (token) headers.Authorization = `Bearer ${token}`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const limit = limits.get(bucket);
      if (limit && limit.remaining <= 0) {
        await waitUntil(limit.reset, bucket);
        limits.delete(bucket);
      }

      let response;
      try {
        response = await fetchImpl(url.toString(), { headers });
      } catch {
        throw new GitHubError("network", "Could not reach api.github.com");
      }
      remember(response, bucket);

      if (response.ok) return response.json();
      if (response.status === 401) throw new GitHubError("token", "GitHub rejected the token");
      if (response.status === 404) throw new GitHubError("not-found", `Not found: ${path}`);
      if (response.status === 422) throw new GitHubError("invalid", `GitHub could not run this query: ${path}`);

      if (response.status === 403 || response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        if (retryAfter > 0) {
          if (retryAfter * 1000 > MAX_WAIT_MS) throw limitError(bucket);
          onWait(retryAfter);
          await sleep(retryAfter * 1000);
          continue;
        }
        const current = limits.get(bucket);
        if (current && current.remaining <= 0) continue;
      }

      throw new GitHubError("http", `GitHub answered HTTP ${response.status} for ${path}`);
    }

    throw limitError(bucket);
  }

  function request(path, params = {}, bucket = "core") {
    const previous = queues.get(bucket) || Promise.resolve();
    const next = previous.catch(() => {}).then(() => send(path, params, bucket));
    queues.set(bucket, next);
    return next;
  }

  async function user(login) {
    return request(`/users/${encodeURIComponent(login)}`);
  }

  async function ownRepos(login, maxPages = 3) {
    const repos = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const batch = await request(`/users/${encodeURIComponent(login)}/repos`, {
        type: "owner",
        sort: "pushed",
        per_page: 100,
        page,
      });
      repos.push(...batch);
      if (batch.length < 100) break;
    }
    return repos;
  }

  async function searchAll(kind, q, { maxPages = 1, sort, order, onPage = () => {} } = {}) {
    const items = [];
    let total = 0;
    for (let page = 1; page <= maxPages; page += 1) {
      onPage(page, maxPages);
      const data = await request(`/search/${kind}`, { q, sort, order, per_page: 100, page }, "search");
      total = data.total_count;
      items.push(...data.items);
      // Search pages sometimes come back short, so only an empty page means the end.
      if (!data.items.length || items.length >= total || items.length >= 1000) break;
    }
    return { total, items };
  }

  async function searchCount(kind, q) {
    const data = await request(`/search/${kind}`, { q, per_page: 1 }, "search");
    return data.total_count;
  }

  async function searchIssues(q, perPage = 8) {
    const data = await request(`/search/issues`, { q, sort: "updated", order: "desc", per_page: perPage }, "search");
    return data.items;
  }

  return { request, user, ownRepos, searchAll, searchCount, searchIssues, limits };
}
