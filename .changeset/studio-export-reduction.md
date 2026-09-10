---
'@kubb/studio': major
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

To upgrade, replace an import of any of these types with the inferred type at its call site
instead of importing it by name.
