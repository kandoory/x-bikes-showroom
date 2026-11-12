# Honda New Showroom — X Bikes Showroom (3D walkthrough)

Interactive 3D walkthrough of the new Honda showroom (Al Ghanim, Kuwait), built for management to approve the design.
One link, opens on phone and laptop, you walk through it like a video game, inside and outside.

Project plan (source of truth for scope): Claude Docs "خطة مشروع X Bikes Showroom"
https://claude.ai/code/artifact/b9ffbd75-c091-44c8-b55d-c477248cead9

## Rules for any agent working here
1. Read `README.md` and `docs/PLAN.md` first. `docs/PLAN.md` has the status checklist and the open questions.
2. **All sizes, positions, colors and names live in `src/config.js`.** Change the showroom from there, not inside the other files.
3. **Never invent dimensions.** Everything in `config.js` marked `TBD` is a placeholder until the real floor plan is in `references/01 - Floor Plan/`. When the plan arrives, replace the numbers and remove the `TBD` mark.
4. **Never recreate the Honda or Al Ghanim logos.** Use only official files dropped in `assets/ci/` (copied from `references/04 - CI/`). Until then, signs show a clearly marked placeholder.
5. Brand colors and fonts come from the official CI only. The red in `config.js` is a placeholder until the CI is in.
6. Product models (GLB) go in `assets/models/` and are wired in `config.js` (`model:` field). Keep them compressed (Draco or Meshopt) so mobile loads fast.
7. Language: UI text is Arabic first (Kuwaiti), English only for model names and official Honda terms. Same rules as `../Honda Marketing/02 - My Creative Style/`.

## Tech
- Plain static site: `index.html` + ES modules in `src/`. Three.js loads from jsDelivr through an import map, pinned to one version. No build step, so GitHub Pages can serve the folder as is.
- Run locally: double-click `run-local.cmd` (or `powershell -ExecutionPolicy Bypass -File tools/serve.ps1`), then open http://localhost:5173.
- Opening `index.html` straight from disk does not work (browsers block ES modules on `file://`).
