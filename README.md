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

- **Main blog** (`/blog/`): add Markdown files to `src/content/blog/`. The filename becomes the URL (for example, `hello.md` becomes `/blog/hello/`). Posts appear newest first. Use this frontmatter; the page supplies the title, so start the body without a duplicate heading:

  ```md
  ---
  title: "A post title"
  date: "2026-10-18"
  description: "An optional short summary."
  ---

  Write your post here.
  ```

- **CTF section** stays at `/ctfblog/`, with links to the main blog and writeups for challenges I created or solved. Existing `/ctfblog/...` and `/writing/...` URLs are preserved.
- **Blog covers** default to `/images/blog-placeholder.svg` on the listing and post page. To replace one, put an image in `public/images/` and add `cover: "/images/your-photo.jpg"` and `coverAlt: "A description of the photo"` to the post's frontmatter.
- **CTF categories**: local posts in `src/content/ctfblog/` use `type: "created"` for challenges I made or `type: "solved"` for challenges I solved (including future Flare-On writeups). The default is `solved`. Prime and the challenge-authoring repository writeups appear under created challenges. Post URLs stay the same when their type changes. General posts go in the main blog.
- **Directory links** use `src/components/DirectoryLinks.astro` immediately below the page heading, before dates, descriptions, and body text. Creative writing titles are supplied by the page template.

- **Portfolio** (`src/content/portfolio`) and **welcome blurb** (`src/content/welcome`) are plain Markdown.
- **CTF writeups** are pulled at build time from GitHub via `src/content/loaders/githubWriteups.ts`, grouped by competition.
- **Creative writing** (`/writing/`) lives in `src/content/writing`.
