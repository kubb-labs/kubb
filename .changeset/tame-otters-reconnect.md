---
'@kubb/studio': minor
---

`createClient` gains an optional `onAuthRequired` callback, called once a live pool's token is
rejected during background reconnect. The whole pool is already stopped by the time it fires, so a
host only needs to obtain a replacement token and start a new client with it.

It never fires for a token rejected at startup, which `connect()` already reports by throwing, nor
for an ordinary session expiry or a revoked session, both of which keep reconnecting on their own.

`startPairing` and `pollForPairingToken` take an optional `signal` too, so a host can cancel an
in-flight pairing or poll. Aborting rejects with the new `PairingCanceledError`, exported from the
package, so a canceled pairing is distinguishable from a denial or an expired code.
