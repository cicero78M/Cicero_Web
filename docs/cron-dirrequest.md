# Cron Dir Request Coverage

This scheduler matrix drives **dir request** menu executions for BIDHUMAS and DITSAMAPTA.
The cron entries are defined in [`backend/src/services/dirRequestScheduler.js`](../backend/src/services/dirRequestScheduler.js) and register
`cronDirRequestCustomSequence` jobs for each client, menu, and reporting window.

## Schedule

All times use the `Asia/Jakarta` (WIB) timezone.

| Client ID  | Menu | 15:00 | 18:00 | 20:30 | 22:00 |
|------------|------|:-----:|:-----:|:-----:|:-----:|
| BIDHUMAS   | 28   |   ✅   |   ✅   |   ✅   |   ✅   |
| BIDHUMAS   | 29   |   ✅   |   ✅   |   ✅   |   ✅   |
| DITSAMAPTA | 28   |   ✅   |   ✅   |   ✅   |   ✅   |
| DITSAMAPTA | 29   |   ✅   |   ✅   |   ✅   |   ✅   |

Each schedule uses the cron expressions:

- `0 15 * * *`
- `0 18 * * *`
- `30 20 * * *`
- `0 22 * * *`

Use `registerDirRequestCustomSequences(scheduler)` to register all jobs against a scheduler that exposes
`cronDirRequestCustomSequence({ clientId, menuId, cronExpression, timezone, windowLabel })`.
