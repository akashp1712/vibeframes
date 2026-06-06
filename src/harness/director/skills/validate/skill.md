---
name: validate
description: How to interpret the validation report and decide whether to retry Compose or ship.
---

# Validate — interpret the rule report

`check-storyboard()` returns:

```
{
  pass: boolean,
  issues: [
    { severity: "error" | "warning" | "info",
      beatIndex: number | null,
      rule: string,
      message: string },
    ...
  ],
  attempts: number,
  ranAt: epochMs
}
```

## Pass policy

```
   pass: true,  issues: []                    → ship clean
   pass: true,  issues: [warnings only]       → ship; quote warnings
   pass: false, issues: [≥1 error]            → retry Compose
```

## Rule glossary

| rule                       | severity | meaning                                      |
| -------------------------- | -------- | -------------------------------------------- |
| beat-not-built             | error    | A beat.built is still false                  |
| clip-coverage              | error    | beat.clipIds reference missing clips         |
| duration-drift             | warning  | beat clip span vs storyboard durationMs > 500ms |
| consecutive-block-repeat   | warning  | 3+ adjacent beats use the same primary block |
| brand-color-presence       | warning  | <30% of clips include brief.brand.primaryColor |
| shot-block-mismatch        | info     | extreme-close beat using split-screen       |
| forbidden-pattern          | warning  | browser chrome / nav / sidebar regex hits    |

## Retry on errors

If `pass: false`:

1. Identify which beats are flagged (issues[*].beatIndex).
2. For each flagged beat:
   - `beat-not-built` → `create-beat({ index })` for that index.
   - `clip-coverage` → `rebuild-beat({ index })` (drops + re-emits).
3. Re-run `check-storyboard()`.

Max 2 retries. If a third validate fails, ship and surface the errors
in your final reply ("Validation flagged beats 2 and 4 unbuilt — let
me know if you want me to retry those.").

## Final reply discipline

Two sentences max. Quote warnings briefly. NEVER quote info-severity
issues — they're for the build log, not the user.

Good: `Cinematic launch reel for engineering teams, 5 beats with
brand purple woven through. One warning: beat 3 repeats the
split-screen — let me know if you want a different mid-beat block.`
