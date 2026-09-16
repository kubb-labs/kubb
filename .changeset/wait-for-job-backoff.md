---
'@kubb/studio': patch
---

Back off while polling a Studio job, so a long snapshot stops exhausting the API key rate limit.

`waitForJob` polled `GET /api/jobs/{id}` every second. The CLI's `kubb studio snapshot` waits up to
10 minutes by default, which is up to 600 requests against a budget of 100 per window. Worse, the
window only resets after a whole window with no request, so a one-second poll could never escape
the limit once it hit it, and every later call failed until the run gave up.

The poll now starts at one second and doubles to a 15 second ceiling, which keeps even an hour-long
wait inside the budget. It also honors a `429` by waiting the `tryAgainIn` Studio returns, and sets
`retry: false` on the request, since ofetch otherwise retries a `429` immediately and spends the
budget faster than not retrying at all.
