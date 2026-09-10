---
'@kubb/studio': patch
---

Trim `@kubb/studio`'s public API to what the `kubb studio` CLI command and the Docker agent
actually use.

- Removed the unused hook context types `StudioCommandStartContext`, `StudioCommandEndContext`,
  `StudioConnectingContext`, `StudioDisconnectedContext`, `StudioErrorContext`, and
  `StudioWarnContext` from the package's root export. `StudioConnectedContext` stays exported.
  Hook payloads for `studio:connecting`, `studio:command:start`, `studio:command:end`,
  `studio:disconnected`, `studio:warn`, and `studio:error` still type-check through
  `Hookable<KubbHooks>['hook']`, since the underlying types are still declared, just no longer
  importable by name.
- Removed `ConnectionOutcome` and `TokenRejection` from the root export. Both stay inferable from
  `runConnection`'s return value and `onTokenRejected` callback.

Neither the CLI nor the Docker agent imports any of these by name, so this does not change their
behavior. A consumer that did import one of them by name gets the same type through inference at
the call site instead, such as `runConnection`'s return value or a `hooks.hook('studio:warn', ...)`
callback's parameter.
