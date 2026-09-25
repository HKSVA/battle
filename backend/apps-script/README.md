# CANTOPOP BATTLE 2026 registration backend

This directory is the reviewed source for the Google Apps Script web app bound to the master registration spreadsheet. The live script stores all private configuration in **Project Settings → Script Properties**. No Drive folder IDs, staff addresses, credentials, or deployment tokens belong in public frontend JavaScript.

## Private Script Properties

Configure these in Apps Script:

| Property | Purpose |
| --- | --- |
| `SPREADSHEET_ID` | Master registration spreadsheet |
| `SHEET_NAME` | `Registrations` |
| `PHOTO_FOLDER_ID` | Contestant photo and generated card folder |
| `PAYMENT_FOLDER_ID` | Payment-proof folder |
| `MMO_FOLDER_ID` | Approved MMO folder |
| `REPLY_TO` | Reply address for both emails |
| `STAFF_EMAILS` | Comma-separated staff allowlist |
| `OPEN_AT` | ISO timestamp with Hong Kong offset |
| `REGISTRATION_ENABLED` | Keep `false` until end-to-end QA passes |

The Apps Script and spreadsheet time zones must both be `Asia/Hong_Kong`.

## Sheet tabs

- `Registrations` contains the exact 36-column schema defined in `Core.gs`.
- `MMO Catalog` maps each genre, song, artist and key to one Drive File ID. Staff must verify the actual audio before checking `Approved`.
- The current SOUL and ROCK rows remain unapproved until their exact files are verified. Email 2 fails closed if either approved mapping is missing or wrong.

## Deployment

1. Save `Core.gs` and `Code.gs` in the bound Apps Script project (they may be combined into one editor file).
2. Run `checkConfiguration` once and grant only the requested Spreadsheet, Drive and email scopes.
3. Deploy as a Web app, executing as the project owner, with access limited to the audience required for public registration.
4. Copy the `/exec` URL into `public/registration-config.js` and set `enabled: true` only for controlled QA.
5. Complete one realistic registration, verify Drive files, row statuses, Email 1 and card attachment.
6. Verify payment manually, supply and approve both exact MMO File IDs, then run `SEND CONFIRMATION` and verify Email 2.
7. Confirm a second click does not send Email 2 again. Only after all checks pass should the production frontend be published with registration enabled.

The web app does not use an unrestricted `onEdit` email trigger. Staff must deliberately choose `SEND CONFIRMATION`; the code rechecks `VERIFIED`, `SUBMITTED`, Email 1 state and the two approved MMO mappings under a server-side lock.

