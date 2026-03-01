# cc-shift

**Visualize when your AI worked throughout the day. Like a shift schedule, but for your AI.**

```bash
$ npx cc-shift --date=2026-02-20

AI Shift — Feb 20, 2026 (Friday)

                     00:00       06:00       12:00       18:00
  namakusa            ▓▓▓░░░░░░░░░░░░▓▓▓░▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░
  nursery-shift       ░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓░░░░░░░░░░░░░░░░░░░░
  risk-score-scanner  ░░░▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  spell-cascade       ▓░░░░░░░░░░░░▓▓▓░▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ──────────────────  ────────────────────────────────────────────────
  ALL                 ▓▓▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░

  Active: 13h 0m  ·  00:00 – 13:30 JST  ·  70 sessions
```

Each `▓` block represents ~30 minutes of AI activity. `░` is idle.

## Install & run

```bash
# Yesterday's shift
npx cc-shift

# Specific date
npx cc-shift --date=2026-02-20

# Wider chart
npx cc-shift --cols=72
```

## Ghost Day support

```
AI Shift — Feb 26, 2026 (Thursday)

  👻 Ghost Day — no sessions logged.
```

## Requirements

- Node.js 18+
- `~/ops/proof-log/YYYY-MM-DD.md` files (from Claude Code proof-log hook)

## Options

```
--date=YYYY-MM-DD   Specific date (default: yesterday)
--dir=PATH          Proof-log directory (default: ~/ops/proof-log)
--cols=N            Timeline width in characters (default: 48)
```

## Part of cc-toolkit

One of 33 free tools for understanding your Claude Code usage.
→ [yurukusa.github.io/cc-toolkit](https://yurukusa.github.io/cc-toolkit/)

## License

MIT
