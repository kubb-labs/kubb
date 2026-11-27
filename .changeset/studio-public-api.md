---
'@kubb/studio': patch
---

`kubb studio snapshot` uploads to Kubb Studio's public API, `POST /v1/snapshots` on `api.kubb.studio`, when the Studio reports one in `GET /api/settings`. Without one, or when that lookup fails, it uploads to `POST /api/snapshots` as before.
