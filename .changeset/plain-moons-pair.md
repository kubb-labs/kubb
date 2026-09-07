---
'@kubb/studio': minor
---

Let a host pair as something other than the CLI.

`startPairing` takes an optional `clientId` and `agentKind`. It still defaults to
`kubb-cli`, which `kubb studio login` uses and any signed-in member can approve. A host that pairs
shared or tier-limited infrastructure, such as the `kubblabs/kubb-agent` image, passes
`clientId: 'kubb-agent'` and the kind it wants to register as, whose codes only an admin can
approve.

`pollForPairingToken` now surfaces the server's `error_description` when it has one, so a pairing
refused for a reason of Studio's own, such as the organization already being at its agent limit,
says why instead of reporting a generic expiry.
