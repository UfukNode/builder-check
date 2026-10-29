import { buildReport, dayKey, LIMITS, normalizeLogin, ownRepoLanguages, reposToLookUp, yearWindow } from "./lib/analyze.js";
import { createGitHub, GitHubError } from "./lib/github.js";
import { copy, GITHUB_RULES, LOCALES } from "./lib/i18n.js";
import { ideasFor } from "./lib/ideas.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// The page always opens in English; the TR button switches the open page.
const state = {
  lang: "en",
  status: null,
  busy: false,
  report: null,
};

const els = {
  form: document.querySelector("#checkForm"),
  username: document.querySelector("#username"),
  token: document.querySelector("#token"),
  button: document.querySelector("#checkButton"),
  status: document.querySelector("#status"),
  result: document.querySelector("#result"),
  footer: document.querySelector("#footer"),
  langButtons: document.querySelectorAll("[data-lang]"),
};

class ShownError extends Error {
  constructor(key, vars = {}) {
    super(key);
    this.key = key;
    this.vars = vars;
  }
}

// Copy and formatting

function formats() {
  const locale = LOCALES[state.lang];
  const number = new Intl.NumberFormat(locale);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const monthYear = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const clock = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  return {
    n: (value) => number.format(value),
    date: (value) => day.format(new Date(value)),
    month: (value) => month.format(new Date(value)),
    monthYear: (value) => monthYear.format(new Date(value)),
    clock: (seconds) => clock.format(new Date(seconds * 1000)),
    list: (items) => new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items),
  };
}

function t(key, vars = {}) {
  const value = key.split(".").reduce((node, part) => node?.[part], copy[state.lang]);
  if (typeof value !== "function") return value ?? key;
  const f = formats();
  return value({ n: f.n, m: f.n, ...vars });
}

// DOM helpers

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  setProps(el, props);
  append(el, children);
  return el;
}

function svg(tag, props = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  setProps(el, props);
  append(el, children);
  return el;
}

function setProps(el, props) {
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") el.setAttribute("class", value);
    else if (key === "text") el.textContent = value;
    else if (key === "style") el.setAttribute("style", value);
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : String(value));
  }
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === "") continue;
    el.append(child instanceof Node ? child : String(child));
  }
}

function external(href, text, className) {
  return h("a", { href, class: className, target: "_blank", rel: "noreferrer" }, text);
}

// Numbers in the reading come back wrapped as ⟦kind|text⟧ so they can be set in bold.
function rich(text) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(/⟦(\w*)\|([^⟧]*)⟧/g)) {
    parts.push(text.slice(last, match.index));
    parts.push(h("strong", { class: match[1] === "m" ? "is-merge" : null }, match[2]));
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

// Static copy, language and status

function applyStaticCopy() {
  document.documentElement.lang = state.lang;
  document.title = t("pageTitle");
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const button of els.langButtons) button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
  els.button.textContent = t(state.busy ? "checking" : "check");
}

function setLanguage(lang) {
  state.lang = lang;
  applyStaticCopy();
  renderStatus();
  renderResult({ animate: false });
  renderFooter();
}

function setStatus(key, vars = {}, kind = "busy") {
  state.status = key ? { key, vars, kind } : null;
  renderStatus();
}

function renderStatus() {
  const status = state.status;
  if (!status) {
    els.status.textContent = "";
    els.status.className = "status";
    return;
  }
  const vars = status.vars.reset ? { ...status.vars, time: formats().clock(status.vars.reset) } : status.vars;
  els.status.textContent = t(status.key, vars);
  els.status.className = `status is-${status.kind}`;
}

function errorStatus(error, login) {
  if (error instanceof ShownError) return [error.key, error.vars];
  if (error instanceof GitHubError) {
    if (error.kind === "not-found") return ["errorNotFound", { login }];
    if (error.kind === "rate-limit") return ["errorRate", { reset: error.reset, authenticated: error.authenticated }];
    if (error.kind === "token") return ["errorToken", {}];
    if (error.kind === "network") return ["errorNetwork", {}];
  }
  return ["errorOther", { message: error?.message || String(error) }];
}

// Reading GitHub

// Main languages of the other people's repositories this person works in: one repository
// search answers for up to 30 of them. Without it the report still stands on own repositories.
async function lookUpLanguages(github, { ownRepos, prs, commits }) {
  const languages = ownRepoLanguages(ownRepos);
  const unknown = reposToLookUp({ prs, commits, known: languages });
  if (!unknown.length) return languages;
  setStatus("statusLanguages");
  try {
    const found = await github.searchAll("repositories", `${unknown.map((name) => `repo:${name}`).join(" ")} fork:true`);
    for (const repo of found.items) languages.set(repo.full_name.toLowerCase(), repo.language || "");
  } catch {
    // Extra detail only; the check goes on with what is known.
  }
  return languages;
}

async function runCheck(login) {
  const token = els.token.value.trim();
  const github = createGitHub({ token, onWait: (seconds) => setStatus("statusWait", { seconds }) });

  setStatus("statusProfile");
  const user = await github.user(login);
  if (user.type === "Organization") throw new ShownError("errorOrg", { login: user.login });

  const now = new Date();
  const { from } = yearWindow(now);
  const pages = token ? { commits: 10, prs: 5, repos: 5 } : { commits: 4, prs: 2, repos: 3 };
  const prQuery = `type:pr author:${user.login} -user:${user.login}`;

  setStatus("statusActivity");
  const [ownRepos, prs, reviews, issues, commits] = await Promise.all([
    github.ownRepos(user.login, pages.repos),
    github.searchAll("issues", prQuery, { maxPages: pages.prs, sort: "created", order: "desc" }),
    github.searchCount("issues", `type:pr reviewed-by:${user.login} -author:${user.login} -user:${user.login}`),
    github.searchCount("issues", `type:issue author:${user.login} -user:${user.login}`),
    github.searchAll("commits", `author:${user.login} author-date:>=${dayKey(from)}`, {
      maxPages: pages.commits,
      sort: "author-date",
      order: "desc",
      onPage: (page, max) => {
        if (page > 1) setStatus("statusCommits", { page, pages: max });
      },
    }),
  ]);

  let prTotals = null;
  if (prs.items.length < prs.total) {
    const [merged, open] = await Promise.all([
      github.searchCount("issues", `${prQuery} is:merged`),
      github.searchCount("issues", `${prQuery} is:open`),
    ]);
    prTotals = { all: prs.total, merged, open };
  }

  const repoLanguages = await lookUpLanguages(github, { ownRepos, prs, commits });
  return buildReport({ user, ownRepos, prs, prTotals, commits, reviews, issues, repoLanguages, now });
}

async function check(login) {
  if (state.busy) return;
  state.busy = true;
  els.button.disabled = true;
  els.button.textContent = t("checking");

  try {
    state.report = await runCheck(login);
    setStatus(null);
    try {
      history.replaceState(null, "", `?u=${encodeURIComponent(state.report.login)}`);
    } catch {
      // Some hosts block history changes; the result still shows.
    }
    renderResult({ animate: true });
    els.result.focus({ preventScroll: true });
    els.result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } catch (error) {
    const [key, vars] = errorStatus(error, login);
    setStatus(key, vars, "error");
  } finally {
    state.busy = false;
    els.button.disabled = false;
    els.button.textContent = t("check");
  }
}

// Result

function renderResult({ animate = false } = {}) {
  const report = state.report;
  if (!report) return;
  const f = formats();
  els.result.replaceChildren(
    renderWho(report, f),
    renderYear(report, f, animate),
    renderReading(report, f),
    renderLanguages(report, f),
    renderPrs(report, f),
    renderTools(report, f),
    renderPatterns(report),
    renderImprove(report),
    renderPrompt(report, f),
  );
  els.result.hidden = false;
}

function renderWho(report, f) {
  const since = `${t("since", { date: f.monthYear(report.createdAt) })} (${t("age", report.age)})`;
  return h(
    "div",
    { class: "who" },
    h("img", { class: "avatar", src: `${report.avatar}${report.avatar.includes("?") ? "&" : "?"}s=128`, alt: "", width: 64, height: 64 }),
    h(
      "div",
      {},
      h("h2", { class: "login" }, external(report.url, report.login)),
      h("p", { class: "since" }, [report.name, since].filter(Boolean).join(", ")),
    ),
  );
}

function renderYear(report, f, animate) {
  const { days } = report.window;
  const { commitsByDay, readFrom, complete, read, total } = report.year;
  const merges = report.prs.mergeDays;
  const width = days.length * 4;
  const base = 80;
  const top = 6;
  const max = Math.max(1, ...commitsByDay.values());
  const unreadDays = days.findIndex((day) => day >= readFrom);
  let heavy = false;

  const chart = svg(
    "svg",
    {
      viewBox: `0 0 ${width} 116`,
      preserveAspectRatio: "none",
      role: "img",
      "aria-label": t("stripLabel", { from: f.date(days[0]), to: f.date(days.at(-1)) }),
    },
    svg(
      "defs",
      {},
      svg(
        "pattern",
        { id: "hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
        svg("line", { class: "hatch-line", x1: 0, y1: 0, x2: 0, y2: 6 }),
      ),
    ),
  );

  if (unreadDays > 0) chart.append(svg("rect", { class: "unread", x: 0, y: top, width: unreadDays * 4, height: base - top }));
  chart.append(svg("rect", { class: "base", x: 0, y: base, width, height: 1 }));
  chart.append(svg("rect", { class: "base", x: 0, y: 100.5, width, height: 1 }));

  days.forEach((day, i) => {
    if (day < readFrom) return;
    const count = commitsByDay.get(day) || 0;
    if (count === 0) {
      chart.append(svg("rect", { class: "rest", x: i * 4 + 1, y: base - 2, width: 2, height: 2 }));
    } else {
      const height = 4 + ((base - top - 4) * Math.log1p(count)) / Math.log1p(max);
      const isHeavy = count >= 50;
      heavy ||= isHeavy;
      chart.append(
        svg(
          "rect",
          { class: isHeavy ? "tick heavy" : "tick", x: i * 4 + 0.6, y: base - height, width: 2.8, height, style: `--i:${i}` },
          svg("title", { text: t("dayTitle", { date: f.date(day), count }) }),
        ),
      );
    }
    const merged = merges.get(day);
    if (merged) {
      chart.append(
        svg(
          "rect",
          { class: "merge", x: i * 4 + 0.4, y: 92, width: 3.2, height: 18 },
          svg("title", { text: t("mergeTitle", { date: f.date(day), count: merged }) }),
        ),
      );
    }
  });

  const months = h("div", { class: "months", "aria-hidden": "true" });
  days.forEach((day, i) => {
    if (!day.endsWith("-01") || i > days.length - 12) return;
    months.append(h("span", { style: `left:${((i / days.length) * 100).toFixed(2)}%` }, f.month(day)));
  });

  const legend = h(
    "figcaption",
    { class: "legend" },
    h("span", {}, h("i", { class: "swatch" }), t("legendCommits")),
    heavy && h("span", {}, h("i", { class: "swatch heavy" }), t("legendHeavy")),
    h("span", {}, h("i", { class: "swatch merge" }), t("legendMerged")),
    unreadDays > 0 && h("span", {}, h("i", { class: "swatch unread" }), t("legendUnread")),
  );

  return h(
    "figure",
    { class: animate ? "year" : "year still" },
    chart,
    months,
    legend,
    !complete &&
      h(
        "p",
        { class: "coverage" },
        t("coverage", { read: f.n(read), total: f.n(total), date: f.date(readFrom), authenticated: Boolean(els.token.value.trim()) }),
      ),
  );
}

function readingSentences(report, f, numberFor, mergeFor) {
  const { year, prs, tools } = report;
  const partialFrom = year.complete ? "" : f.date(year.readFrom);
  const [main, ...others] = report.languages.slice(0, 3).map((language) => language.name);
  return [
    t("readingCommits", { login: report.login, days: year.commitDays, weeks: year.weeks, partialFrom, n: numberFor }),
    t("readingPrs", { merged: prs.merged, n: numberFor, m: mergeFor }),
    t("readingRepos", { login: report.login, count: tools.count, stars: tools.stars, forks: tools.forks, n: numberFor }),
    main && t("readingLanguages", { main, others: others.length ? f.list(others) : "" }),
    t("readingPatterns", { found: report.found, n: numberFor }),
  ].filter(Boolean);
}

function renderReading(report, f) {
  const marked = (value) => `⟦|${f.n(value)}⟧`;
  const mergeMarked = (value) => `⟦m|${f.n(value)}⟧`;
  const text = readingSentences(report, f, marked, mergeMarked).join(" ");

  const button = h("button", { class: "quiet-button", type: "button" }, t("copyReading"));
  button.addEventListener("click", async () => {
    const plain = readingSentences(report, f, f.n, f.n).join(" ");
    try {
      await navigator.clipboard.writeText(`${plain}\n\n${t("notAScore")}\nBuilder Check: github.com/${report.login}`);
      button.textContent = t("copied");
      setTimeout(() => {
        button.textContent = t("copyReading");
      }, 1400);
    } catch {
      button.textContent = t("copyReading");
    }
  });

  return h(
    "section",
    { class: "block reading" },
    h("div", { class: "block-head" }, h("h3", {}, t("readingTitle")), button),
    h("p", { class: "reading-text" }, rich(text)),
    h("p", { class: "note" }, t("notAScore")),
  );
}

function renderLanguages(report, f) {
  const section = h("section", { class: "block" }, h("h3", {}, t("languagesTitle")), h("p", { class: "why" }, t("languagesWhy")));
  const shown = report.languages.slice(0, LIMITS.languagesShown);
  if (!shown.length) {
    section.append(h("p", { class: "aside" }, t("languagesEmpty")));
    return section;
  }

  const partialFrom = report.year.complete ? "" : f.date(report.year.readFrom);
  const mostDays = Math.max(1, ...shown.map((language) => language.days));
  const entries = shown.map((language) => {
    const facts = [
      language.days && t("langDays", { days: language.days, partialFrom }),
      language.repos && t("langRepos", { repos: language.repos, stars: language.stars }),
      language.merged && t("langMerged", { merged: language.merged }),
    ].filter(Boolean);
    return h(
      "li",
      { class: `language is-${language.role}` },
      h("div", { class: "language-head" }, h("h4", {}, language.name), h("span", { class: "role" }, t(`roles.${language.role}`))),
      language.days > 0 &&
        h("div", { class: "days-bar", "aria-hidden": "true" }, h("span", { style: `width:${((language.days / mostDays) * 100).toFixed(1)}%` })),
      h("p", { class: "facts" }, facts.join(" ")),
      h("p", { class: "can-label" }, t("canBuild")),
      h("ul", { class: "ideas" }, ideasFor(language.name, state.lang).map((idea) => h("li", {}, idea))),
      h("p", { class: "next" }, h("strong", {}, `${t("nextLabel")}: `), t(`next.${language.next}`, { name: language.name })),
    );
  });
  section.append(h("ol", { class: "languages" }, entries));

  const rest = report.languages.slice(LIMITS.languagesShown).map((language) => language.name);
  if (rest.length) section.append(h("p", { class: "aside" }, t("alsoUsed", { list: f.list(rest) })));
  return section;
}

function renderPrs(report, f) {
  const { prs } = report;
  const section = h("section", { class: "block" }, h("h3", {}, t("prsTitle")));

  if (!prs.repos.length) {
    section.append(h("p", { class: "aside" }, t("prsEmpty")));
  } else {
    const rows = prs.repos.slice(0, 8).map((repo) => {
      const query = encodeURIComponent(`is:pr author:${report.login} is:merged`);
      return h(
        "tr",
        {},
        h("td", {}, external(`https://github.com/${repo.fullName}/pulls?q=${query}`, repo.fullName, "repo")),
        h("td", {}, h("span", { class: "date" }, repo.language)),
        h("td", { class: "num" }, f.n(repo.merged)),
        h("td", { class: "num wide" }, h("span", { class: "date" }, f.date(repo.lastMerged))),
      );
    });
    section.append(
      h(
        "table",
        { class: "table" },
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            h("th", { scope: "col" }, t("colRepo")),
            h("th", { scope: "col" }, t("colLanguage")),
            h("th", { scope: "col", class: "num" }, t("colMerged")),
            h("th", { scope: "col", class: "num wide" }, t("colLastMerge")),
          ),
        ),
        h("tbody", {}, rows),
      ),
    );
    if (prs.repos.length > 8) section.append(h("p", { class: "aside" }, t("moreRepos", { count: prs.repos.length - 8 })));
    if (prs.mergedRead < prs.merged) section.append(h("p", { class: "note" }, t("prsPartial", { read: f.n(prs.mergedRead) })));
  }

  section.append(
    h("p", { class: "aside" }, t("prsOther", { open: prs.open, closed: prs.closed, reviews: prs.reviews, issues: prs.issues })),
  );
  return section;
}

function renderTools(report, f) {
  const { tools } = report;
  const section = h("section", { class: "block" }, h("h3", {}, t("toolsTitle")));

  if (!tools.list.length) {
    section.append(h("p", { class: "aside" }, t("toolsEmpty")));
    return section;
  }

  const rows = tools.list.slice(0, 6).map((tool) =>
    h(
      "tr",
      {},
      h("td", {}, external(tool.url, tool.name, "repo")),
      h("td", { class: "num" }, f.n(tool.stars)),
      h("td", { class: "num" }, f.n(tool.forks)),
      h("td", { class: "wide" }, h("span", { class: "date" }, tool.language)),
    ),
  );
  section.append(
    h(
      "table",
      { class: "table" },
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          h("th", { scope: "col" }, t("colRepo")),
          h("th", { scope: "col", class: "num" }, t("colStars")),
          h("th", { scope: "col", class: "num" }, t("colForks")),
          h("th", { scope: "col", class: "wide" }, t("colLanguage")),
        ),
      ),
      h("tbody", {}, rows),
    ),
  );

  const more = tools.list.length - 6;
  section.append(h("p", { class: "aside" }, more > 0 ? t("toolsMore", { count: more }) : t("toolsNoMore")));
  if (tools.read < tools.publicRepos) {
    section.append(h("p", { class: "note" }, t("toolsPartial", { read: tools.read, total: tools.publicRepos })));
  }
  return section;
}

function patternVars(pattern, f) {
  const vars = { ...pattern };
  if (pattern.day) vars.date = f.date(pattern.day);
  return vars;
}

function renderPatterns(report) {
  const f = formats();
  const items = report.patterns.map((pattern) =>
    h(
      "li",
      { class: pattern.found ? "found" : null },
      h("span", { class: "dot", "aria-hidden": "true" }),
      h("span", { class: "check-title" }, t(`patterns.${pattern.id}.title`)),
      h("span", { class: "check-state" }, t(pattern.found ? "foundLabel" : "clear")),
      pattern.found && h("span", { class: "check-detail" }, t(`patterns.${pattern.id}.found`, patternVars(pattern, f))),
    ),
  );

  return h(
    "section",
    { class: "block" },
    h("h3", {}, t("patternsTitle")),
    h("p", { class: "why" }, t("patternsWhy"), " ", external(GITHUB_RULES, `(${t("source")})`)),
    h("ul", { class: "checks" }, items),
  );
}

function renderImprove(report) {
  const section = h("section", { class: "block" }, h("h3", {}, t("improveTitle")));
  if (!report.improve.length) {
    section.append(h("p", { class: "aside" }, t("improveNone")));
    return section;
  }
  const items = report.improve.map((item) =>
    h(
      "li",
      {},
      h("span", { class: "improve-title" }, t(`improve.${item.id}.title`)),
      h("span", { class: "improve-detail" }, t(`improve.${item.id}.detail`, item)),
    ),
  );
  section.append(h("p", { class: "why" }, t("improveWhy")), h("ol", { class: "improve" }, items));
  return section;
}

// AI prompt

const shorten = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

function promptText(report, f) {
  const { year, prs, tools } = report;
  return t("prompt", {
    login: report.login,
    date: f.date(report.window.to),
    since: f.monthYear(report.createdAt),
    days: year.commitDays,
    weeks: year.weeks,
    partialFrom: year.complete ? "" : f.date(year.readFrom),
    merged: prs.merged,
    reviews: prs.reviews,
    issues: prs.issues,
    repos: tools.count,
    stars: tools.stars,
    forks: tools.forks,
    languages: report.languages.slice(0, LIMITS.languagesShown),
    topRepos: tools.list.slice(0, 5).map((tool) => ({ ...tool, description: shorten(tool.description, 100) })),
    improve: report.improve.map((item) => t(`improve.${item.id}.title`)),
  });
}

function renderPrompt(report, f) {
  const text = h("textarea", { class: "prompt", rows: 16, spellcheck: "false", "aria-label": t("promptTitle") });
  text.value = promptText(report, f);
  const button = h("button", { class: "quiet-button", type: "button" }, t("copyPrompt"));
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text.value);
      button.textContent = t("copied");
      setTimeout(() => {
        button.textContent = t("copyPrompt");
      }, 1400);
    } catch {
      // Clipboard blocked: select the text so a manual copy works.
      text.focus();
      text.select();
    }
  });
  return h(
    "section",
    { class: "block" },
    h("div", { class: "block-head" }, h("h3", {}, t("promptTitle")), button),
    h("p", { class: "why" }, t("promptWhy")),
    text,
  );
}

// Footer

function renderFooter() {
  els.footer.replaceChildren(h("h2", {}, t("footerTitle")), h("p", {}, t("footerBody")), h("p", {}, t("footerNote")));
}

// Start

for (const button of els.langButtons) button.addEventListener("click", () => setLanguage(button.dataset.lang));

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const login = normalizeLogin(els.username.value);
  if (!login) {
    setStatus("errorInvalid", {}, "error");
    els.username.focus();
    return;
  }
  els.username.value = login;
  check(login);
});

applyStaticCopy();
renderFooter();

const preset = normalizeLogin(new URLSearchParams(location.search).get("u") || "");
if (preset) {
  els.username.value = preset;
  check(preset);
}
