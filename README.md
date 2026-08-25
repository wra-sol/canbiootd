# CanBIO-OTD

Daily Canadian biography reader. Content from the
[Dictionary of Canadian Biography](https://www.biographi.ca/)
(University of Toronto / Université Laval).

**Non-commercial.** Biographies are reproduced unmodified with attribution under the
[DCB Terms of Use](https://www.biographi.ca/en/notices.html).

## Quick start

```bash
# sample data (already built: ~40 bios)
cd app && npm start

# full corpus (~9k bios, polite crawl ~5h)
cd pipeline && npm run all
# then restart the app — bios.sqlite is copied into app/assets/
```

## Structure

| Path | Role |
| --- | --- |
| `pipeline/` | Index → fetch → parse → SQLite |
| `app/` | Expo (React Native) iOS/Android/web |

## Pipeline commands

```bash
cd pipeline
npm run index      # A–Z browse → index.json
npm run fetch      # polite HTML cache (resumable)
npm run parse      # HTML → parsed.jsonl
npm run build-db   # → data/bios.sqlite + app/assets/bios.sqlite
npm run sample     # letter A page 1 only (dev)
npm run all        # index + fetch + parse + build-db
```

## App features

- Biography of the day (deterministic worldwide pick)
- Full-text reader (EN/FR), archive, search, saved
- Dark mode, font scale, local daily reminder
- Share + link to biographi.ca + DCB attribution

## Legal

- Free / non-commercial only (no ads without DCB written permission)
- Text stored verbatim; images not bundled
- Cite DCB/DBC as source; do not claim endorsement
