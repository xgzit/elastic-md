# Repository Guidelines

## Project Structure & Module Organization
This repository is a VitePress-based documentation site for Elasticsearch notes.

- `docs/`: main documentation source (`index.md` and `chapters/chapter-*/`).
- `docs/public/`: static assets published by VitePress, including `article-images/` and `legacy/`.
- `tools/`: Node.js preprocessing and migration scripts (content extraction, image localization, HTML-to-Markdown conversion).
- `public/data/`: intermediate extracted content (for example `article-content.html`).
- `dist/`: final build output (generated; do not edit manually).

Keep authored content in `docs/chapters/` and treat `dist/` as disposable output.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: run full preprocessing pipeline, then start local docs server at `http://127.0.0.1:5178`.
- `npm run build`: clean and regenerate content, build VitePress, then copy final output to `dist/`.
- `npm run preview`: preview the built docs site locally.
- `npm run migrate:docs`: run migration pipeline only (`tools/vitepress-migration/`).

Example: run `npm run dev` after editing chapter files to validate rendering and links.

## Coding Style & Naming Conventions
- Use UTF-8 Markdown with clear section headings and short paragraphs.
- Follow existing chapter naming: `NN-PP-topic-subtopic.md` (e.g., `01-04-入门-环境准备.md`).
- Keep JavaScript tools in CommonJS style as currently used in `tools/`.
- Prefer small, single-purpose scripts over large multi-responsibility files.

## Testing Guidelines
There is no formal automated test suite yet. Validate changes by:

1. Running `npm run dev` and checking changed pages.
2. Running `npm run build` to ensure the full pipeline succeeds.
3. Spot-checking generated assets and links under `dist/`.

If adding logic-heavy tooling in `tools/`, include a simple validation script or reproducible command.

## Commit & Pull Request Guidelines
History is short and mixed (`init`, Chinese summaries, and one Conventional Commit: `chore(git): ...`). For consistency going forward:

- Prefer Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.
- Keep subject lines imperative and under ~72 characters.
- In PRs, include: purpose, key changed paths, local verification commands run, and screenshots for UI/content rendering changes when relevant.
