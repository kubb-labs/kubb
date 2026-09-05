---
'@kubb/studio': minor
---

`createClient` now accepts an `onAuthRequired` callback, fired once when Studio rejects a live
pool's token during background reconnect, after every session in the pool has already stopped. It
never fires for a token rejected at startup or an ordinary session expiry.

`startPairing` and `pollForPairingToken` accept an optional `signal` to cancel an in-flight
pairing or poll, rejecting with the new `PairingCanceledError`.
