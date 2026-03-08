# COPILOT Notes

## Goal

This file helps GitHub Copilot work consistently in this workspace.

## Project Layout

- `rss-reader.html`: Vanilla HTML + JavaScript version
- `rss-reader-vue.html`: Vue via CDN version
- `rss-reader-vue-project/`: Main Vue 3 + Vite project

## Main Workflow

1. `make install` to install dependencies.
2. `make dev` to run the local development server.
3. `make test` to run a local validation build.
4. `cd rss-reader-vue-project && railway up` to deploy.

## Key Technical Rules

- Keep feed loading resilient: do not wipe old articles before a successful refresh.
- Treat external feed content as untrusted input.
- Avoid `v-html` for dynamic feed text unless sanitized.
- Keep search index data in sync when feeds are updated or removed.
- Keep article categories in sync with feed parser outputs (`RSS`, `Atom`, `rss2json`).
- When an article category filter is active, hide feed cards without matching items.
- Preserve sidebar tab state (`Filter`, `Feeds`, `Verwalten`) via LocalStorage.

## Quick Review Checklist

- Does `npm run build` pass?
- Are active/inactive feeds handled correctly?
- Is mobile sidebar behavior still correct?
- Does tab navigation in sidebar work and persist?
- Do category filters hide non-matching feeds correctly?
- Are search results safe and correct?
- Are LocalStorage parsing failures handled safely?

## Useful Commands

- `make help`
- `make build`
- `make test`
- `cd rss-reader-vue-project && railway up`
- `cd rss-reader-vue-project && railway domain`
