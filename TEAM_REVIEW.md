# CANTOPOP BATTLE 2026 — Team review

Source: user-selected CANTOPOP_BATTLE_2026_TEAM_REVIEW/index.html; original preserved.
Source SHA-256: b22c125dfd8fec2d9e1229d788a1dc99660721b77cea8d7111be833db0bc9696

## Audit before editing
- Still missing: JYD in GRAND FINAL; footer logo assets referenced a missing assets folder.
- Partially implemented: separate preview/export renderers with divergent crop, border and typography; MMO wording not identical throughout; sticky CTA not excluded from Golden Ticket; mobile navigation links hidden by an older CSS rule.
- Needs visual improvement: simple-gradient foil; boxed song fields; crowded mobile identity area; partner logos with inconsistent visible size and old white-background SVA artwork.
- Already good / freeze: hero composition, navigation order, early criteria section, numbered entry steps, judges' existing artwork, locked song lists, dates, fee, prize amounts, Golden Ticket mechanism, Artist Development roles, separate optional marketing consent and T&C/PICS content.

## Changes
- One shared 1080×1350 canvas for the 4:5 live card and JPEG export. Compact supplied official logo, full portrait crop, restrained foil edge, clear name/IG/statement hierarchy, two editorial song columns and selected session bottom line. No added slogans or fake contestant number.
- Statement required; Unicode code-point count and clear maximum-20 validation; corrected input clears the error.
- Live photo, name, IG, statement, songs and session updates. Text fits available width. Empty IG consumes no separator or space.
- Fixed mobile menu, responsive song columns, stacked host cards and final three-card judge panel; preserved supplied judges' artwork and titles.
- Embedded runtime footer logos; replaced old SVA strip art; optically sized transparent assets without altering originals. Added available PORTAL mark alongside PORTAL Music.
- Unified MMO wording in song note, FAQ and terms; retained key-change policy.
- Sticky CTA hides when Golden Ticket, registration, partners or footer enters view; also hidden during menu/dialog interaction.
- Dialog keyboard focus contained and restored on close.
- Existing form had no submission service and falsely claimed success. Kept fields, fee and FPS/bank/proof flow; valid submission now states this is a team preview and nothing was submitted.

## QA
- Desktop and mobile reviewed; no page overflow at 320, 390, 768, 1024 and 1440px.
- All seven mobile menu entries visible; six anchor destinations exist.
- CANTOPOPFEST, T&C and Privacy/PICS dialogs open and close.
- No missing visible images or browser page errors.
- 20-character statement accepted; 21 characters rejected; empty IG omitted.
- Long display names, IG, 20 Chinese characters and selected songs/session fit renderer.
- JPEG downloaded successfully; dimensions 1080×1350. PNG and JPEG use the same canvas, with only expected lossy JPEG differences.
- Sticky CTA hidden at registration and Golden Ticket.
- Test portrait came from an existing judge asset purely for local rendering QA; no test name or photo is prefilled in the delivered site.

## Outstanding for approval / launch
- Latest user correction applied: GRAND FINAL has exactly three cards, ordered Guddy, Vicky, black question-mark card reading 即將揭曉. JYD removed.
- Dedicated CANTOPOPFEST transparent logo not available; organiser category keeps approved text without substituting a BATTLE logo.
- Official CANTOPOPFEST poster is still pending in the supplied source.
- Formal registration submission service, payment details and end-to-end receipt verification remain unconfigured. No real registration or payment was sent.
