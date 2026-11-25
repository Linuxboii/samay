# Samay

Find a meeting time across time zones.

**Live:** https://samay.avlokai.com

**For:** Remote teams, families spread across countries, and anyone booking a call with someone abroad.

## What it does

- Every hour of the day side by side for each place
- Working, awake and asleep hours coloured
- Highlights the hours that suit everyone best
- Daylight saving handled by the browser time zone database
- The whole plan lives in the URL, so a link shares it

Uses Intl.DateTimeFormat, no time zone data is bundled or fetched.

## Demand

Semrush estimates World Time Buddy, a time zone comparison site, at roughly 9 to 10.7 million visits a month.

- [Semrush: worldtimebuddy.com](https://www.semrush.com/website/worldtimebuddy.com/overview/)

These figures measure demand for the task, from existing tools. They are third-party estimates or company claims, not usage of this tool.

## Privacy

Everything runs in your browser. There is no backend, no analytics and no account. Nothing you enter is uploaded.

## Run locally

No build step and no runtime dependencies. Serve the folder with any static server:

```
npx serve .
```

## Tests

The logic lives in `lib.js` as pure functions, tested with the Node test runner (Node 20+):

```
npm test
```

## Files

- `index.html` page and styles
- `app.js` wiring between the page and the logic
- `lib.js` pure logic, no DOM
- `lib.test.js` tests
- `base.css`, `ui.js` shared look and small DOM helpers

## Licence

MIT. Made by [Sushanth Kasturi](https://sushanth.avlokai.com).
