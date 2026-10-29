# Security

Report issues by opening a GitHub issue in the public repository where this folder is published.

## Non-Goals

This app does not request GitHub OAuth permissions, store tokens, connect wallets, request signatures, run a backend service, or send data anywhere except `api.github.com`. It reads public GitHub data for the username entered on the page. Avatar images load from `avatars.githubusercontent.com`.

## Review Checklist

Before deploying a public copy, verify:

- `index.html` only loads `./styles.css`, `./app.js` and files under `./assets/`.
- `lib/github.js` only calls `https://api.github.com`, and the token is only sent in the `Authorization` header.
- The token is never written to `localStorage`, `sessionStorage`, cookies, URLs or logs.
- `server.js` only serves files from this folder and answers `GET` and `HEAD`.
- No analytics, trackers or third-party scripts were added.
