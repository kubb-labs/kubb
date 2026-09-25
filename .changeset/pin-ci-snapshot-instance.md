---
'@kubb/studio': patch
'@kubb/cli': patch
---

`kubb studio snapshot` runs its snapshot job on the agent process it connected, so two overlapping pipelines of the same CI agent never build each other's checkout.

- `createJob` accepts `instanceId`, and sends it on `POST /api/jobs`. A Studio that does not know the field ignores it.
- `createClient` accepts an `instanceId`, so a host that queues its own jobs can name its process. Without one, each client still gets a random id.
