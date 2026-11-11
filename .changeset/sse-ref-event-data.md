---
'@kubb/adapter-oas': patch
---

Type the `data` of a `text/event-stream` event from its `contentSchema` when the event is a `$ref` to a component, as a `oneOf` member or as the whole `itemSchema`, the same as inline events. The component itself keeps `data` as a string wherever it is used outside the stream.
