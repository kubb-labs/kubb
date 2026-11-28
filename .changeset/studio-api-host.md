---
'@kubb/studio': patch
---

`kubb studio snapshot` finds the public API from `--url`: the same host with `api.` in front, so `https://kubb.studio` uploads to `https://api.kubb.studio/v1/snapshots` and `https://dev.kubb.studio` to `https://api.dev.kubb.studio/v1/snapshots`. A Studio on `localhost` takes the upload on its own origin. `KUBB_STUDIO_API_URL` and the `/api/snapshots` fallback are gone.
