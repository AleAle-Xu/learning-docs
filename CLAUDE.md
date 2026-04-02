# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run docs:dev      # Start dev server (http://localhost:5173)
npm run docs:build    # Build static site to docs/.vitepress/dist/
npm run docs:preview  # Preview the production build
```

## Architecture

This is a [VitePress](https://vitepress.dev/) static documentation site.

**Key files:**
- `docs/.vitepress/config.ts` — Site config: nav bar, sidebar, title, base path (`/learning-docs/`)
- `docs/.vitepress/theme/index.ts` — Registers the default VitePress theme and imports custom CSS
- `docs/.vitepress/theme/custom.css` — All visual customizations (brand colors, homepage layout, dark mode)
- `docs/index.md` — Homepage (uses VitePress `layout: home` frontmatter with hero + features)

**Content structure:** Markdown files under `docs/` map directly to URL paths. To add a new page, create the `.md` file and register it in the `sidebar` array in `config.ts`.

## Theming & Dark Mode

All homepage styling uses CSS custom properties defined in `custom.css`:
- `:root { ... }` — light mode values
- `.dark { ... }` — dark mode overrides (VitePress adds this class to `<html>`)

The homepage background/nav/cards all read from `--home-*` variables so that toggling dark mode works automatically. Avoid hardcoding color values directly in selectors for homepage elements.
