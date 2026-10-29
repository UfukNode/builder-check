// Turns raw GitHub API data into the counts Builder Check shows. Pure functions, no I/O.

export const DAY_MS = 86_400_000;

export const LIMITS = {
  seriesCommits: 10,
  heavyDayCommits: 50,
  emptyRepos: 3,
  reposOneDay: 5,
  typoPrs: 3,
  share: 0.5,
  languagesShown: 4,
  lookupRepos: 30,
  improveShown: 5,
  fewRepos: 3,
  steadyWeeks: 26,
};

const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const MERGE_MESSAGE = /^merge\b/i;
// "Update README.md", "Create index.html": the messages GitHub's web editor writes for you
const WEB_EDITOR_MESSAGE = /^(update|create|delete|rename|add) \S+$|^add files via upload$/;
const TYPO_TITLE = /\b(typos?|spelling|misspell(?:ed|ing|ings)?|grammar)\b/i;

export function normalizeLogin(input) {
  let value = String(input || "").trim();
  value = value.replace(/^https?:\/\//i, "").replace(/^(www\.)?github\.com\//i, "").replace(/^@/, "");
  value = value.split(/[/?#\s]/)[0];
  return LOGIN.test(value) ? value : "";
}

export function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function startOfUtcDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function yearWindow(now) {
  const to = startOfUtcDay(now);
  const from = new Date(to.getTime() - 364 * DAY_MS);
  const days = [];
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) days.push(dayKey(t));
  return { from, to, days };
}

export function normalizeMessage(message) {
  return String(message || "")
    .split("\n")[0]
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}

export function repoFromApiUrl(url) {
  const match = /\/repos\/([^/]+\/[^/]+)$/.exec(String(url || ""));
  return match ? match[1] : "";
}

export function accountAge(createdAt, now) {
  const start = new Date(createdAt);
  const end = new Date(now);
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  months = Math.max(months, 0);
  return { years: Math.floor(months / 12), months: months % 12 };
}

// The same message, ten or more times inside 24 hours. Merges and web editor defaults are skipped.
export function findCommitSeries(commits) {
  const groups = new Map();
  for (const item of commits) {
    const message = normalizeMessage(item.commit.message);
    if (!message || MERGE_MESSAGE.test(message) || WEB_EDITOR_MESSAGE.test(message)) continue;
    if (!groups.has(message)) groups.set(message, []);
    // Numbers become # so "Update builder log 93" reads as the series it belongs to.
    const example = item.commit.message.split("\n")[0].replace(/\d+/g, "#");
    groups.get(message).push({ time: Date.parse(item.commit.author.date), example });
  }

  let worst = null;
  for (const entries of groups.values()) {
    if (entries.length < LIMITS.seriesCommits) continue;
    entries.sort((a, b) => a.time - b.time);
    let start = 0;
    for (let end = 0; end < entries.length; end += 1) {
      while (entries[end].time - entries[start].time > DAY_MS) start += 1;
      const count = end - start + 1;
      if (count >= LIMITS.seriesCommits && (!worst || count > worst.count)) {
        worst = { count, total: entries.length, example: entries[end].example };
      }
    }
  }
  return worst;
}

export function findHeavyDays(commitsByDay) {
  const heavy = [...commitsByDay.entries()].filter(([, count]) => count >= LIMITS.heavyDayCommits);
  if (!heavy.length) return null;
  const [day, count] = heavy.sort((a, b) => b[1] - a[1])[0];
  return { days: heavy.length, day, count };
}

export function findReposOnOneDay(repos) {
  const byDay = new Map();
  for (const repo of repos) {
    const day = dayKey(repo.created_at);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }
  const [day, count] = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return count >= LIMITS.reposOneDay ? { day, count } : null;
}

function check(id, data) {
  return { id, found: Boolean(data), ...(data || {}) };
}

// Main language per repository (lowercase full name -> GitHub's language name), from the
// person's own repositories; others are filled in by a repository search.
export function ownRepoLanguages(ownRepos) {
  const languages = new Map();
  for (const repo of ownRepos) languages.set(repo.full_name.toLowerCase(), repo.language || "");
  return languages;
}

// Repositories whose language is still unknown, most active first: merged pull requests
// weigh more than single commits.
export function reposToLookUp({ prs, commits, known, limit = LIMITS.lookupRepos }) {
  const activity = new Map();
  const add = (fullName, weight) => {
    if (!fullName || known.has(fullName.toLowerCase())) return;
    activity.set(fullName, (activity.get(fullName) || 0) + weight);
  };
  for (const item of prs.items) if (item.pull_request?.merged_at) add(repoFromApiUrl(item.repository_url), 3);
  for (const item of commits.items) add(item.repository?.full_name, 1);
  return [...activity.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([fullName]) => fullName);
}

// One commit can show up once per repository that holds it, for example in forks other
// people made of your repository. Each commit is kept once, in your own repository when
// it is there.
export function uniqueCommits(items, login) {
  const mine = `${String(login).toLowerCase()}/`;
  const bySha = new Map();
  const kept = [];
  for (const item of items) {
    if (!item.sha) {
      kept.push(item);
      continue;
    }
    const index = bySha.get(item.sha);
    if (index === undefined) {
      bySha.set(item.sha, kept.length);
      kept.push(item);
    } else if (String(item.repository?.full_name).toLowerCase().startsWith(mine)) {
      kept[index] = item;
    }
  }
  return kept;
}

// Next steps that suit the evidence in one language, best fit first. Always general: no
// project is named.
function nextSteps({ days, repos, stars, merged }) {
  const steps = [];
  if (stars >= 10) steps.push("maintain");
  if (days < 5 && repos <= 1 && merged === 0 && stars < 10) steps.push("start");
  if (merged > 0 && repos === 0) steps.push("ownTool");
  if (repos > 0 && merged === 0) steps.push("contribute");
  if (merged > 0) steps.push("review");
  if (days >= 10) steps.push("deepen");
  if (repos > 0) steps.push("showcase");
  steps.push("rhythm");
  return steps;
}

// Per language: commit days, own repositories and stars, merged pull requests. Languages
// are ranked by that evidence; the first one is the main language.
export function languageProfile({ own, yearCommits, merged, repoLanguages }) {
  const entries = new Map();
  const entry = (name) => {
    if (!entries.has(name)) entries.set(name, { name, daySet: new Set(), repos: 0, stars: 0, merged: 0 });
    return entries.get(name);
  };
  const languageOf = (fullName) => repoLanguages.get(String(fullName || "").toLowerCase()) || "";

  for (const repo of own) {
    if (!repo.language) continue;
    const e = entry(repo.language);
    e.repos += 1;
    e.stars += repo.stargazers_count;
  }
  for (const item of yearCommits) {
    const language = languageOf(item.repository?.full_name);
    if (language) entry(language).daySet.add(dayKey(item.commit.author.date));
  }
  for (const item of merged) {
    const language = languageOf(repoFromApiUrl(item.repository_url));
    if (language) entry(language).merged += 1;
  }

  const ranked = [...entries.values()]
    .map(({ daySet, ...rest }) => ({ ...rest, days: daySet.size }))
    .map((e) => ({ ...e, weight: e.days + 3 * e.merged + 2 * e.repos }))
    .sort((a, b) => b.weight - a.weight || b.stars - a.stars || a.name.localeCompare(b.name));

  // Each language gets its own step, so the list never repeats one sentence.
  const used = new Set();
  return ranked.map(({ weight, ...e }, i) => {
    const steps = nextSteps(e);
    const next = steps.find((step) => !used.has(step)) || steps[0];
    used.add(next);
    return {
      ...e,
      role: i === 0 ? "main" : e.days >= 10 || e.repos >= 3 || e.merged >= 1 || e.stars >= 10 ? "regular" : "occasional",
      next,
    };
  });
}

export function buildReport({ user, ownRepos, prs, prTotals, commits, reviews, issues, repoLanguages, now = new Date() }) {
  const login = user.login;
  const window = yearWindow(now);
  const firstDay = window.days[0];
  const languages = repoLanguages || ownRepoLanguages(ownRepos);
  const languageOf = (fullName) => languages.get(String(fullName || "").toLowerCase()) || "";

  // Commits: what the search returned for the last 12 months, newest first, each commit once.
  const yearCommits = uniqueCommits(commits.items, login).filter((item) => dayKey(item.commit.author.date) >= firstDay);
  const commitsByDay = new Map();
  for (const item of yearCommits) {
    const day = dayKey(item.commit.author.date);
    commitsByDay.set(day, (commitsByDay.get(day) || 0) + 1);
  }
  const complete = commits.items.length >= commits.total;
  const oldestRead = commits.items.length ? dayKey(commits.items[commits.items.length - 1].commit.author.date) : firstDay;
  const readFrom = complete || oldestRead < firstDay ? firstDay : oldestRead;
  const weeks = new Set(
    [...commitsByDay.keys()].map((day) => Math.floor((Date.parse(day) - window.from.getTime()) / (7 * DAY_MS))),
  );
  const busiest = [...commitsByDay.entries()].sort((a, b) => b[1] - a[1])[0] || null;

  // Pull requests in repositories the user does not own.
  const merged = prs.items.filter((item) => item.pull_request?.merged_at);
  const openCount = prs.items.filter((item) => item.state === "open").length;
  const closedCount = prs.items.filter((item) => item.state === "closed" && !item.pull_request?.merged_at).length;
  const totals = prTotals || { all: prs.total, merged: merged.length, open: openCount };
  const totalClosed = Math.max(totals.all - totals.merged - totals.open, 0) || closedCount;

  const byRepo = new Map();
  for (const item of merged) {
    const fullName = repoFromApiUrl(item.repository_url);
    const entry = byRepo.get(fullName) || { fullName, merged: 0, lastMerged: "", language: languageOf(fullName) };
    entry.merged += 1;
    if (item.pull_request.merged_at > entry.lastMerged) entry.lastMerged = item.pull_request.merged_at;
    byRepo.set(fullName, entry);
  }
  const prRepos = [...byRepo.values()].sort((a, b) => b.merged - a.merged || b.lastMerged.localeCompare(a.lastMerged));
  const mergeDays = new Map();
  for (const item of merged) {
    const day = dayKey(item.pull_request.merged_at);
    if (day >= firstDay) mergeDays.set(day, (mergeDays.get(day) || 0) + 1);
  }

  // Repositories the user owns; forks are left out.
  const own = ownRepos.filter((repo) => !repo.fork);
  const stars = own.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const forks = own.reduce((sum, repo) => sum + repo.forks_count, 0);
  const tools = [...own]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count || (b.pushed_at || "").localeCompare(a.pushed_at || ""))
    .map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language || "",
      description: String(repo.description || "").trim(),
    }));

  // Patterns that can read as automated or farmed.
  const external = prs.items.length;
  const typoCount = prs.items.filter((item) => TYPO_TITLE.test(item.title)).length;
  const emptyRepos = own.filter((repo) => repo.size === 0).length;
  const patterns = [
    check("series", findCommitSeries(yearCommits)),
    check("heavy", findHeavyDays(commitsByDay)),
    check("bulk", findReposOnOneDay(own)),
    check("empty", emptyRepos >= LIMITS.emptyRepos ? { count: emptyRepos } : null),
    check("typo", typoCount >= LIMITS.typoPrs && typoCount / external >= LIMITS.share ? { count: typoCount, total: external } : null),
  ];
  const found = patterns.filter((pattern) => pattern.found).length;

  // What would improve the profile most, in this order. Each item comes from a count.
  const active = own.filter((repo) => !repo.archived);
  const allReposRead = ownRepos.length >= (user.public_repos ?? 0);
  const undescribed = active.filter((repo) => !String(repo.description || "").trim()).length;
  const unlicensed = active.filter((repo) => repo.size > 0 && !repo.license).length;
  const untagged = active.some((repo) => Array.isArray(repo.topics)) ? active.filter((repo) => !repo.topics?.length).length : 0;
  const yearAgo = window.from.toISOString();
  const stale = active.filter((repo) => repo.pushed_at && repo.pushed_at < yearAgo).length;
  const noLink = !user.blog && !user.twitter_username;
  const improve = [
    found > 0 && { id: "patterns", count: found },
    allReposRead && !ownRepos.some((repo) => repo.name.toLowerCase() === login.toLowerCase()) && { id: "profileReadme", login },
    (!user.bio || noLink) && { id: "profile", bio: !user.bio, link: noLink },
    undescribed > 0 && { id: "descriptions", count: undescribed, total: active.length },
    unlicensed >= LIMITS.fewRepos && { id: "license", count: unlicensed },
    untagged >= LIMITS.fewRepos && { id: "topics", count: untagged },
    stale >= LIMITS.fewRepos && { id: "stale", count: stale },
    complete && commitsByDay.size > 0 && weeks.size < LIMITS.steadyWeeks && { id: "rhythm", weeks: weeks.size },
    totals.merged === 0 && { id: "firstMerge" },
    reviews === 0 && totals.merged > 0 && { id: "reviews" },
  ]
    .filter(Boolean)
    .slice(0, LIMITS.improveShown);

  return {
    login,
    name: user.name || "",
    avatar: user.avatar_url,
    url: user.html_url,
    createdAt: user.created_at,
    age: accountAge(user.created_at, now),
    window,
    year: {
      commitsByDay,
      commitDays: commitsByDay.size,
      weeks: weeks.size,
      busiest: busiest ? { day: busiest[0], count: busiest[1] } : null,
      read: commits.items.length,
      total: commits.total,
      complete,
      readFrom,
    },
    prs: {
      merged: totals.merged,
      mergedRead: merged.length,
      open: totals.open,
      closed: totalClosed,
      reviews,
      issues,
      repos: prRepos,
      mergeDays,
    },
    tools: {
      count: own.length,
      stars,
      forks,
      list: tools,
      read: ownRepos.length,
      publicRepos: user.public_repos ?? ownRepos.length,
    },
    languages: languageProfile({ own, yearCommits, merged, repoLanguages: languages }),
    patterns,
    found,
    improve,
  };
}
