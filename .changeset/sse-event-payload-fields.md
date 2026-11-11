---
'@kubb/adapter-oas': patch
---

Read a `text/event-stream` item whose `event` sits next to payload fields, such as Scalar Galaxy's `{ event, planet, note }`, as the event's `data` instead of the whole event. Before, mocks dropped `planet` and `note`, the type put them on the event, and the client never filled them. An item that declares `data`, or only the SSE fields `event`, `id` and `retry`, is still read as the whole event.
