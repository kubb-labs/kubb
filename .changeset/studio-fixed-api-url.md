---
'@kubb/studio': patch
---

`kubb studio snapshot` no longer asks Studio for its public API address. For the hosted Studio it uploads to `https://api.kubb.studio/v1/snapshots`, and for any other `--url` to `/api/snapshots`. Set `KUBB_STUDIO_API_URL` to use the `/v1` routes of another public API hostname.
