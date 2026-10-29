import assert from "node:assert/strict";
import test from "node:test";
import {
  accountAge,
  buildReport,
  uniqueCommits,
  findCommitSeries,
  findHeavyDays,
  findReposOnOneDay,
  languageProfile,
  normalizeLogin,
  ownRepoLanguages,
  repoFromApiUrl,
  reposToLookUp,
  yearWindow,
} from "../lib/analyze.js";
import { copy } from "../lib/i18n.js";
import { ideasFor } from "../lib/ideas.js";

const commit = (message, date, repo = "someone/repo", sha) => ({
  sha,
  commit: { message, author: { date } },
  repository: { full_name: repo },
});

const minute = (day, i) => `${day}T10:${String(i).padStart(2, "0")}:00Z`;

function report(overrides = {}) {
  return buildReport({
    user: { login: "dev", name: "Dev", avatar_url: "a", html_url: "u", created_at: "2024-01-01T00:00:00Z", public_repos: 2 },
    ownRepos: [
      {
        name: "tool",
        full_name: "dev/tool",
        html_url: "x",
        fork: false,
        stargazers_count: 7,
        forks_count: 2,
        language: "Rust",
        size: 10,
        created_at: "2025-01-01T00:00:00Z",
        pushed_at: "2026-10-01T00:00:00Z",
      },
      {
        name: "fork",
        full_name: "dev/fork",
        html_url: "y",
        fork: true,
        stargazers_count: 50,
        forks_count: 5,
        language: "Go",
        size: 10,
        created_at: "2025-01-01T00:00:00Z",
        pushed_at: "2026-10-01T00:00:00Z",
      },
    ],
    prs: {
      total: 3,
      items: [
        { title: "fix a bug", state: "closed", repository_url: "https://api.github.com/repos/org/chain", pull_request: { merged_at: "2026-09-01T10:00:00Z" } },
        { title: "add tests", state: "closed", repository_url: "https://api.github.com/repos/other/app", pull_request: { merged_at: "2026-08-01T10:00:00Z" } },
        { title: "draft", state: "open", repository_url: "https://api.github.com/repos/org/chain", pull_request: { merged_at: null } },
      ],
    },
    commits: {
      total: 3,
      items: [
        commit("feat: one", "2026-10-20T10:00:00Z", "org/chain"),
        commit("feat: two", "2026-10-20T12:00:00Z", "dev/tool"),
        commit("fix: three", "2026-09-02T09:00:00Z", "dev/tool"),
      ],
    },
    reviews: 0,
    issues: 1,
    repoLanguages: new Map([
      ["dev/tool", "Rust"],
      ["dev/fork", "Go"],
      ["org/chain", "Rust"],
      ["other/app", "TypeScript"],
    ]),
    now: new Date("2026-10-28T12:00:00Z"),
    ...overrides,
  });
}

test("normalizeLogin accepts names, @names and profile links", () => {
  assert.equal(normalizeLogin("UfukNode"), "UfukNode");
  assert.equal(normalizeLogin(" @UfukNode "), "UfukNode");
  assert.equal(normalizeLogin("https://github.com/UfukNode/"), "UfukNode");
  assert.equal(normalizeLogin("github.com/UfukNode?tab=repositories"), "UfukNode");
  assert.equal(normalizeLogin("-bad"), "");
  assert.equal(normalizeLogin("two--dashes"), "");
  assert.equal(normalizeLogin(""), "");
});

test("repoFromApiUrl reads owner and name", () => {
  assert.equal(repoFromApiUrl("https://api.github.com/repos/0xMiden/miden-vm"), "0xMiden/miden-vm");
  assert.equal(repoFromApiUrl("nope"), "");
});

test("a numbered message repeated inside a day is a series", () => {
  const commits = Array.from({ length: 12 }, (_, i) => commit(`Update builder log ${i + 1}`, minute("2026-06-13", i)));
  const series = findCommitSeries(commits);
  assert.equal(series.count, 12);
  assert.equal(series.total, 12);
  assert.equal(series.example, "Update builder log #");
});

test("release commits spread over months are not a series", () => {
  const commits = Array.from({ length: 14 }, (_, i) =>
    commit(`chore(release): 1.${i}.0`, new Date(Date.UTC(2026, 0, 1 + i * 9)).toISOString()),
  );
  assert.equal(findCommitSeries(commits), null);
});

test("merges and web editor messages are not a series", () => {
  const merges = Array.from({ length: 15 }, (_, i) => commit(`Merge pull request #${i} from a/b`, minute("2026-06-13", i)));
  const edits = Array.from({ length: 15 }, (_, i) => commit("Update README.md", minute("2026-06-14", i)));
  assert.equal(findCommitSeries([...merges, ...edits]), null);
});

test("heavy days start at 50 commits", () => {
  assert.equal(findHeavyDays(new Map([["2026-01-01", 49]])), null);
  assert.deepEqual(
    findHeavyDays(
      new Map([
        ["2026-01-01", 50],
        ["2026-01-02", 80],
      ]),
    ),
    { days: 2, day: "2026-01-02", count: 80 },
  );
});

test("five repositories on one day are flagged, four are not", () => {
  const repos = Array.from({ length: 5 }, () => ({ created_at: "2026-03-03T08:00:00Z" }));
  assert.deepEqual(findReposOnOneDay(repos), { day: "2026-03-03", count: 5 });
  assert.equal(findReposOnOneDay(repos.slice(1)), null);
});

test("accountAge counts whole months", () => {
  assert.deepEqual(accountAge("2025-04-19T00:00:00Z", "2026-10-28T00:00:00Z"), { years: 1, months: 6 });
  assert.deepEqual(accountAge("2026-10-01T00:00:00Z", "2026-10-28T00:00:00Z"), { years: 0, months: 0 });
});

test("yearWindow covers 365 days ending today", () => {
  const { days } = yearWindow(new Date("2026-10-28T15:00:00Z"));
  assert.equal(days.length, 365);
  assert.equal(days[0], "2025-10-29");
  assert.equal(days.at(-1), "2026-10-28");
});

test("buildReport counts days, merged pull requests, own repos and languages", () => {
  const result = report();
  assert.equal(result.year.commitDays, 2);
  assert.equal(result.year.complete, true);
  assert.equal(result.prs.merged, 2);
  assert.equal(result.prs.open, 1);
  assert.equal(result.prs.mergeDays.get("2026-09-01"), 1);
  assert.deepEqual(
    result.prs.repos.map((repo) => [repo.fullName, repo.language]),
    [
      ["org/chain", "Rust"],
      ["other/app", "TypeScript"],
    ],
  );
  assert.equal(result.tools.count, 1);
  assert.equal(result.tools.stars, 7);
  assert.equal(result.found, 0);
  assert.deepEqual(
    result.languages.map((l) => [l.name, l.days, l.repos, l.stars, l.merged, l.role]),
    [
      ["Rust", 2, 1, 7, 1, "main"],
      ["TypeScript", 0, 0, 0, 1, "regular"],
    ],
  );
});

test("a partial read keeps its start date", () => {
  const result = report({ commits: { total: 900, items: [commit("feat: one", "2026-10-20T10:00:00Z", "org/chain")] } });
  assert.equal(result.year.complete, false);
  assert.equal(result.year.readFrom, "2026-10-20");
});

test("a farmed log series is found", () => {
  const items = Array.from({ length: 30 }, (_, i) => commit(`Update builder log ${i + 1}`, minute("2026-06-13", i), "dev/tool"));
  const result = report({ commits: { total: 30, items } });
  assert.equal(result.patterns.find((pattern) => pattern.id === "series").found, true);
  assert.equal(result.found, 1);
});

test("languages fall back to own repositories when nothing else is known", () => {
  const result = report({ repoLanguages: undefined });
  assert.deepEqual(
    result.languages.map((l) => l.name),
    ["Rust"],
  );
  assert.equal(result.prs.repos[0].language, "");
});

test("reposToLookUp lists unknown repositories, merged pull requests first", () => {
  const known = ownRepoLanguages([{ full_name: "Dev/Tool", language: "Rust" }]);
  assert.equal(known.get("dev/tool"), "Rust");
  const list = reposToLookUp({
    prs: {
      items: [
        { repository_url: "https://api.github.com/repos/org/chain", pull_request: { merged_at: "2026-09-01T10:00:00Z" } },
        { repository_url: "https://api.github.com/repos/org/open", pull_request: { merged_at: null } },
      ],
    },
    commits: {
      items: [
        commit("a", "2026-10-01T10:00:00Z", "dev/tool"),
        commit("b", "2026-10-01T10:00:00Z", "busy/repo"),
        commit("c", "2026-10-02T10:00:00Z", "busy/repo"),
        commit("d", "2026-10-03T10:00:00Z", "org/chain"),
      ],
    },
    known,
  });
  assert.deepEqual(list, ["org/chain", "busy/repo"]);
});

test("languageProfile ranks languages by evidence and picks a fitting next step", () => {
  const own = [
    { language: "TypeScript", stargazers_count: 40 },
    { language: "TypeScript", stargazers_count: 2 },
    { language: "Shell", stargazers_count: 0 },
    { language: null, stargazers_count: 5 },
  ];
  const yearCommits = [
    ...Array.from({ length: 12 }, (_, i) => commit("feat", `2026-05-${String(i + 1).padStart(2, "0")}T10:00:00Z`, "me/web")),
    commit("fix", "2026-06-01T10:00:00Z", "me/web"),
    commit("feat", "2026-06-02T10:00:00Z", "big/engine"),
  ];
  const merged = [
    { repository_url: "https://api.github.com/repos/big/engine" },
    { repository_url: "https://api.github.com/repos/big/engine" },
  ];
  const repoLanguages = new Map([
    ["me/web", "TypeScript"],
    ["big/engine", "Rust"],
  ]);
  const languages = languageProfile({ own, yearCommits, merged, repoLanguages });
  assert.deepEqual(
    languages.map((l) => [l.name, l.days, l.repos, l.stars, l.merged, l.role, l.next]),
    [
      ["TypeScript", 13, 2, 42, 0, "main", "maintain"],
      ["Rust", 1, 0, 0, 2, "regular", "ownTool"],
      ["Shell", 0, 1, 0, 0, "occasional", "start"],
    ],
  );
});

test("each language gets ideas in both languages, with a general list for the rest", () => {
  assert.equal(ideasFor("TypeScript", "en").length, 4);
  assert.equal(ideasFor("TypeScript", "tr").length, 4);
  assert.deepEqual(ideasFor("SCSS", "en"), ideasFor("CSS", "en"));
  assert.deepEqual(ideasFor("Vue", "tr"), ideasFor("Svelte", "tr"));
  assert.match(ideasFor("Nim", "en")[0], /Nim/);
  assert.match(ideasFor("Nim", "tr")[0], /Nim/);
});

test("ideas and copy carry no links and no farming advice", () => {
  const names = /https?:\/\/|www\.|airdrop/i;
  const languages = ["TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "Kotlin", "Swift", "C", "C++", "C#", "PHP", "Ruby", "Solidity", "Move", "Cairo", "Shell", "HTML", "CSS", "Vue", "Dart", "Jupyter Notebook", "R", "Scala", "Elixir", "Haskell", "Lua", "Zig", "Dockerfile", "HCL"];
  for (const lang of ["en", "tr"]) {
    for (const language of languages) for (const idea of ideasFor(language, lang)) assert.doesNotMatch(idea, names, idea);
    const texts = (node) => Object.values(node).flatMap((value) => (value && typeof value === "object" ? texts(value) : [String(value)]));
    for (const text of texts(copy[lang])) assert.doesNotMatch(text, names, text);
  }
});

test("English and Turkish copy have the same keys", () => {
  const keys = (node, prefix = "") =>
    Object.entries(node).flatMap(([key, value]) =>
      value && typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    );
  assert.deepEqual(keys(copy.tr).sort(), keys(copy.en).sort());
});

test("a commit copied into other people's forks counts once, in the person's own repository", () => {
  const items = [
    commit("feat: tool", "2026-10-20T10:00:00Z", "someone/tool-fork", "abc"),
    commit("feat: tool", "2026-10-20T10:00:00Z", "dev/tool", "abc"),
    commit("feat: tool", "2026-10-20T10:00:00Z", "other/tool-fork", "abc"),
    commit("fix: other", "2026-10-21T10:00:00Z", "org/chain", "def"),
  ];
  assert.deepEqual(
    uniqueCommits(items, "Dev").map((item) => item.repository.full_name),
    ["dev/tool", "org/chain"],
  );
  const series = Array.from({ length: 12 }, (_, i) => commit("Bump version", minute("2026-06-13", 0), `fan${i}/tool`, "same"));
  const result = report({ commits: { total: 12, items: series } });
  assert.equal(result.year.commitsByDay.get("2026-06-13"), 1);
  assert.equal(result.patterns.find((pattern) => pattern.id === "series").found, false);
});

test("languages with the same evidence still get different next steps", () => {
  const own = [
    { language: "TypeScript", stargazers_count: 200 },
    { language: "JavaScript", stargazers_count: 130 },
    { language: "Shell", stargazers_count: 180 },
  ];
  const languages = languageProfile({ own, yearCommits: [], merged: [], repoLanguages: new Map() });
  const steps = languages.map((l) => l.next);
  assert.equal(new Set(steps).size, steps.length, steps.join(","));
  assert.equal(steps[0], "maintain");
});

test("the profile gaps come in order of impact, each from a count", () => {
  assert.deepEqual(
    report().improve.map((item) => item.id),
    ["profileReadme", "profile", "descriptions", "rhythm", "reviews"],
  );
  const profile = report().improve.find((item) => item.id === "profile");
  assert.deepEqual([profile.bio, profile.link], [true, true]);
  assert.deepEqual(report().improve.find((item) => item.id === "descriptions"), { id: "descriptions", count: 1, total: 1 });

  const items = Array.from({ length: 30 }, (_, i) => commit(`Update builder log ${i + 1}`, minute("2026-06-13", i), "dev/tool"));
  assert.equal(report({ commits: { total: 30, items } }).improve[0].id, "patterns");

  const user = { login: "dev", name: "Dev", avatar_url: "a", html_url: "u", created_at: "2024-01-01T00:00:00Z", public_repos: 1, bio: "Builds tools", blog: "https://dev.example" };
  const ownRepos = [
    { name: "dev", full_name: "dev/dev", fork: false, stargazers_count: 0, forks_count: 0, size: 5, description: "Profile", topics: ["profile"], license: { key: "mit" }, created_at: "2025-01-01T00:00:00Z", pushed_at: "2026-10-01T00:00:00Z" },
  ];
  const tidy = report({ user, ownRepos, prs: { total: 0, items: [] } });
  assert.deepEqual(
    tidy.improve.map((item) => item.id),
    ["rhythm", "firstMerge"],
  );
});

test("the AI prompt carries the person's own numbers and asks for ideas", () => {
  const n = (value) => new Intl.NumberFormat("en-GB").format(value);
  const data = {
    login: "dev",
    date: "29 Oct 2026",
    since: "April 2025",
    days: 91,
    weeks: 33,
    partialFrom: "",
    merged: 9,
    reviews: 0,
    issues: 2,
    repos: 47,
    stars: 652,
    forks: 323,
    languages: [{ name: "TypeScript", days: 43, repos: 3, stars: 213, merged: 2 }],
    topRepos: [{ name: "tool", language: "TypeScript", stars: 180, description: "" }],
    improve: ["Add a profile README"],
    n,
  };
  const en = copy.en.prompt(data);
  assert.match(en, /account dev, read on 29 Oct 2026/);
  assert.match(en, /Commits on 91 days across 33 weeks in the last 12 months\./);
  assert.match(en, /- TypeScript: 43 commit days, 3 own repositories with 213 stars, 2 merged pull requests/);
  assert.match(en, /- tool \(TypeScript, 180 stars\)\n/);
  assert.match(en, /- Add a profile README/);
  assert.match(en, /Five project ideas/);
  const tr = copy.tr.prompt({ ...data, n: (value) => new Intl.NumberFormat("tr-TR").format(value) });
  assert.match(tr, /33 farklı haftaya yayılan 91 günde commit attım/);
  assert.match(tr, /- TypeScript: commit atılan gün 43, kendi repo 3 \(yıldız 213\), merge olan PR 2/);
  assert.match(tr, /beş proje fikri/);
});
