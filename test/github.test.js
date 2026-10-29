import assert from "node:assert/strict";
import test from "node:test";
import { createGitHub, GitHubError } from "../lib/github.js";

const reply = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const limit = (remaining, reset, resource) => ({
  "x-ratelimit-remaining": String(remaining),
  "x-ratelimit-reset": String(reset),
  "x-ratelimit-resource": resource,
});

test("an empty search bucket is waited out, then the next search runs", async () => {
  let clock = 1_000_000;
  const waits = [];
  const fetchImpl = async (url) =>
    url.includes("q=first")
      ? reply(200, { total_count: 1, items: [] }, limit(0, clock / 1000 + 30, "search"))
      : reply(200, { total_count: 5, items: [] }, limit(9, clock / 1000 + 60, "search"));
  const github = createGitHub({
    fetchImpl,
    now: () => clock,
    sleep: async (ms) => {
      waits.push(ms);
      clock += ms;
    },
  });

  assert.equal(await github.searchCount("issues", "first"), 1);
  assert.equal(await github.searchCount("issues", "second"), 5);
  assert.equal(waits.length, 1);
  assert.ok(waits[0] > 30_000 && waits[0] <= 31_000);
});

test("an hourly limit fails with the reset time instead of waiting", async () => {
  const fetchImpl = async () => reply(403, { message: "API rate limit exceeded" }, limit(0, 2_000_000, "core"));
  const github = createGitHub({ fetchImpl, now: () => 1_000_000, sleep: async () => assert.fail("should not sleep") });
  await assert.rejects(github.user("someone"), (error) => error instanceof GitHubError && error.kind === "rate-limit" && error.reset === 2_000_000);
});

test("an unknown user is a not-found error", async () => {
  const github = createGitHub({ fetchImpl: async () => reply(404, { message: "Not Found" }) });
  await assert.rejects(github.user("nobody-here"), (error) => error.kind === "not-found");
});

test("short search pages keep paging until the total is read", async () => {
  const sizes = { 1: 85, 2: 100, 3: 15 };
  const fetchImpl = async (url) => {
    const page = Number(new URL(url).searchParams.get("page"));
    return reply(200, { total_count: 200, items: Array.from({ length: sizes[page] }, (_, i) => ({ id: `${page}-${i}` })) });
  };
  const github = createGitHub({ fetchImpl });
  const result = await github.searchAll("commits", "author:dev", { maxPages: 4 });
  assert.equal(result.items.length, 200);
  assert.equal(result.total, 200);
});

test("the token goes only in the Authorization header", async () => {
  let seen;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return reply(200, { login: "dev" });
  };
  await createGitHub({ token: "secret-token", fetchImpl }).user("dev");
  assert.equal(seen.options.headers.Authorization, "Bearer secret-token");
  assert.equal(seen.url.includes("secret-token"), false);
  assert.ok(seen.url.startsWith("https://api.github.com/"));
});
