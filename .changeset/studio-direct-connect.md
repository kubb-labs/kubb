---
'@kubb/studio': patch
'@kubb/cli': patch
---

Connect to Kubb Studio over one WebSocket, and publish CI snapshots in one request. This needs a Kubb Studio release with the same protocol.

- `connectAgent` replaces `runConnection` and `createClient`. It resolves on shutdown and rejects with `InvalidAgentTokenError` when Studio refuses the token, so the host pairs again in its own loop. Pass one `hooks` emitter instead of `installLogger`.
- `createSnapshot` replaces `createAgent`, `createJob`, and `waitForJob`. It generates in memory, packs the tarball, and sends one `POST /api/snapshots` with the CI API key. Snapshots come only from CI now, so the `publishSnapshot` RPC is gone.
- `pairAgent` takes a `machineId`. `setStorage`, `createFileStorage`, `machineTokenFrom`, `connectWebSocketRpc`, `startPairing`, and `pollForPairingToken` are gone, and the runtime no longer reads `KUBB_AGENT_SECRET`.
- The `studio:*` hooks are now `studio:connected`, `studio:disconnected`, `studio:reconnecting`, `studio:command`, `studio:warn`, and `studio:error`.
- `kubb studio snapshot` drops `--timeout` and the `--allow-*` flags. Overlapping CI runs no longer end each other's session, so they need no `concurrency` group.

```typescript
// Before
await runConnection({ credentials: { token }, clientOptions: () => ({ configPath, loadConfig, version, installLogger }), onTokenRejected: async () => null })

// After
await connectAgent({ token, configPath, loadConfig, version, hooks, signal })
```
