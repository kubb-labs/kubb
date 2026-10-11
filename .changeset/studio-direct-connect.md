---
'@kubb/studio': patch
'@kubb/cli': patch
---

Connect to Kubb Studio over one WebSocket, and publish CI snapshots in one request. Needs a Kubb Studio release that accepts Kubb 5.6.1 agents.

- Replace `runConnection` and `createClient` with `connectAgent`. It resolves on shutdown and rejects with `InvalidAgentTokenError` when Studio refuses the token, so the host pairs again in its own loop. Pass one `hooks` emitter instead of `installLogger`.
- Replace `createAgent`, `createJob`, and `waitForJob` with `createSnapshot`. It generates like `kubb generate`, with the formatter, the linter, and `output.postGenerate`. It then packs the tarball and sends one `POST /api/snapshots` with the CI API key. Snapshots come only from CI now, so the `publishSnapshot` RPC is gone.
- Pass a `machineId` to `pairAgent`. `setStorage`, `createFileStorage`, `machineTokenFrom`, `connectWebSocketRpc`, `startPairing`, and `pollForPairingToken` are removed, and the runtime no longer reads `KUBB_AGENT_SECRET`.
- Rename the `studio:*` hooks to `studio:connected`, `studio:disconnected`, `studio:reconnecting`, `studio:command`, `studio:warn`, and `studio:error`.
- Drop `--timeout` and the `--allow-*` flags from `kubb studio snapshot`. Overlapping CI runs no longer end each other's session, so they need no `concurrency` group.

```typescript
// Before
await runConnection({ credentials: { token }, clientOptions: () => ({ configPath, loadConfig, version, installLogger }), onTokenRejected: async () => null })

// After
await connectAgent({ token, configPath, loadConfig, version, hooks, signal })
```
