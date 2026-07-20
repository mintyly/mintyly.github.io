# june.ong

Source for [june.ong](https://mintyly.github.io/) — my personal site: portfolio, CTF writeups, and blog, styled as a retro OS desktop.

Built with [Astro](https://astro.build), deployed to GitHub Pages via Actions.

## Project structure

```text
/
├── public/
│   ├── assets/            # static images/icons referenced directly by URL
│   └── scripts/
│       ├── sidebar.js     # docks the navbar/ame.gif/lastfm.exe beside the main window, or collapses to a mobile toggle
│       ├── windows.js     # drag/close/taskbar behavior for every .window element
│       └── lastfm.js      # fetches recent tracks from the Last.fm API and renders them
├── src/
│   ├── assets/            # images processed by Astro's asset pipeline
│   ├── components/        # Navbar, AmeWindow, LastFmWindow, Welcome, Portfolio, Ctfblog, Writing
│   ├── content/            # content collections (welcome, portfolio, ctfblog, writing) + the GitHub writeups loader
│   ├── layouts/            # Layout.astro, MarkdownPostLayout.astro
│   ├── pages/              # index, ctfblog(+ slugs, writeups), writing(+ slugs)
│   └── styles/kangel.css   # the whole site's styling - windows, taskbar, retro bevels, palette
└── package.json
```

## The window manager

Every page is built out of draggable, closable "windows" (title bar, content, bottom bar) styled like a late-90s desktop OS, plus a taskbar for reopening closed ones. That behavior is entirely client-side (`public/scripts/windows.js` + `sidebar.js`), driven by plain `.window` markup — no framework needed for it. `welcome.txt`, `portfolio.txt`, and each page's main content window are pinned (can't be closed); `nav.exe`, `ame.gif`, and `lastfm.exe` are normal, closeable, draggable windows.

## Commands

All commands run from the project root:

| Command           | Action                                       |
| :----------------- | :-------------------------------------------- |
| `npm install`       | Install dependencies                          |
| `npm run dev`       | Start the local dev server at `localhost:4321` |
| `npm run build`     | Build the production site to `./dist/`        |
| `npm run preview`   | Preview the production build locally          |
| `npm run astro ...` | Run Astro CLI commands (`astro add`, `astro check`, etc.) |

## Content

- **Portfolio** (`src/content/portfolio`) and **welcome blurb** (`src/content/welcome`) are plain Markdown.
- **CTF writeups** are pulled at build time from GitHub via `src/content/loaders/githubWriteups.ts`, grouped by competition.
- **Writing/blog posts** live in `src/content/writing`.
