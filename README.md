# CANTOPOP BATTLE 2026

Production website and registration workflow for CANTOPOP BATTLE 2026.

## Public website

- `index.html` is the standalone GitHub Pages build.
- `registration-config.js` contains public frontend configuration only.
- `public/` contains the source page, scripts, styles and official supplied assets.
- `app/`, `package.json` and `scripts/` contain the build source and tooling.

The repository keeps `CNAME` for `battle.hksva.com`.

## Test locally

```bash
npm ci
node --test tests/apps-script-core.test.cjs
npm run build
```

You can also serve the repository root with any static server and open `index.html`.

## Registration backend

The Google Apps Script source is under `backend/apps-script/`:

- `Core.gs` contains validation, capacity, duplicate and ID logic.
- `Code.gs` contains Drive, Sheet, email, card and staff confirmation integration.
- `appsscript.json` defines the required scopes and Hong Kong time zone.
- `README.md` lists the private Script Properties and deployment procedure.

Private spreadsheet IDs, Drive folder IDs, staff addresses and deployment credentials must be configured in Apps Script **Project Settings → Script Properties**. They must not be committed to this repository.

The public form remains closed while `registration-config.js` has `enabled: false`. For controlled testing, deploy the Apps Script web app, set its `/exec` URL in `registration-config.js`, and change `enabled` to `true`. Complete the checks in `PRELAUNCH_QA.md` before public launch.

## Current operational blocker

ROCK MMO files and approved MMO File ID mappings are still pending. Email 2 intentionally fails closed until both selected MMO files have approved exact mappings.
