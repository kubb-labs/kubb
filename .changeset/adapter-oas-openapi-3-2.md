---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Read the OpenAPI 3.2 fields for streamed responses, so plugins can type `text/event-stream`, JSON Lines, NDJSON and JSON Text Sequence content.

- `ContentNode` gets `stream` with `itemSchema` and `itemShape` for a sequence of items. `schema` holds the same item node, so a plugin that only reads `schema` types one item.
- A `text/event-stream` item schema becomes one event type per `oneOf` member, with `event` as a literal and `data` typed from `contentSchema`.
- A string schema node carries `content` with the `mediaType` and decoded `schema` of the value it holds.
- The adapter also reads `in: querystring` parameters, `$ref`s into `components.mediaTypes`, `additionalOperations`, and `discriminator.defaultMapping`.

```yaml
text/event-stream:
  itemSchema:
    required: [event]
    properties:
      event: { type: string }
      data: { type: string }
    oneOf:
      - properties:
          event: { const: message_delta }
          data: { contentMediaType: application/json, contentSchema: { $ref: '#/components/schemas/MessageDelta' } }
      - properties:
          event: { const: ping }
```

```ts
type StreamEvent = { event: 'message_delta'; data: MessageDelta } | { event: 'ping'; data?: string }
```
