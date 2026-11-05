---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Read the OpenAPI 3.2 fields that type streamed responses, so plugins can generate from `text/event-stream`, JSON Lines, NDJSON and JSON Text Sequence documents.

- Set `ContentNode.itemSchema`, `sequential` and `itemShape` for a sequential media type. `itemSchema` comes from the 3.2 `itemSchema`, or from `schema` on `text/event-stream` in a 3.0 or 3.1 document, and `schema` holds the same item node, so `schema: string` next to `itemSchema` types one item instead of a string.
- Turn the 3.2 `text/event-stream` item schema into one event per union member, with `event` as a literal and `data` typed from `contentSchema` when `contentMediaType` is JSON.
- Carry `contentMediaType` and `contentSchema` on a string schema node.
- Accept `in: querystring` parameters, a `$ref` into `components.mediaTypes`, the methods in `additionalOperations`, and the `defaultMapping` schema as the fallback member of a discriminated union.

```ts
// text/event-stream with itemSchema: { properties: { event, data }, oneOf: [{ event: message_delta, data: contentSchema MessageDelta }, { event: ping }] }
type StreamEvent = { event: 'message_delta'; data: MessageDelta; id?: string; retry?: number } | { event: 'ping'; data?: string; id?: string; retry?: number }
```
