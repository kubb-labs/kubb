---
'@kubb/studio': patch
---

Back off while polling a Studio job, so a long snapshot stops exhausting the API key rate limit.

`waitForJob` polled `GET /api/jobs/{id}` every second, starting the instant the job was queued. The
CLI's `kubb studio snapshot` waits up to 10 minutes by default, which is up to 600 requests against
a budget of 100 per window. The window only resets after a whole window with no request, so a
one-second poll could never escape the limit once it hit it, and every later call failed until the
run gave up. The budget belongs to the organization key, so concurrent CI runs share it.

The first poll now waits two seconds, since a job runs a generation and packs a tarball before it
can possibly finish. From there the interval doubles to a 30 second ceiling, bringing a 10 minute
wait down from 600 requests to 23. A 429 pushes the next poll out by the `tryAgainIn` Studio
returns and never pulls it back in, and `retry: false` stops ofetch retrying a 429 with no delay.
