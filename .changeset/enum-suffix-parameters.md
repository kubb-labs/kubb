---
'@kubb/adapter-oas': patch
---

Apply `enumSuffix` to inline enums on operation parameters and response headers. With `enumSuffix: 'Marker'`, a query parameter `state` on `getPets` now generates `GetPetsStateMarker` instead of `GetPetsState`, the same as an inline enum on a model property.
