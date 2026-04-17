# Kubb Studio <> Kubb Agent migration

## Sandbox `input` payload changed

The Studio → Agent `generate` payload now aligns with `JSONConfig` from `@kubb/core`.

### Before

```json
{
  "type": "command",
  "command": "generate",
  "payload": {
    "input": "openapi: 3.0.0",
    "plugins": [
      { "name": "@kubb/plugin-ts", "options": {} }
    ]
  }
}
```

### After

```json
{
  "type": "command",
  "command": "generate",
  "payload": {
    "input": { "data": "openapi: 3.0.0" },
    "plugins": [
      { "name": "@kubb/plugin-ts", "options": {} }
    ]
  }
}
```

## Why

The agent now reuses the JSON config types from `@kubb/core` instead of maintaining a separate agent-only shape. This keeps the Studio payload, browser/API config, and schema generation aligned.

## Scope

- This change only affects sandbox input overrides sent over the Studio ↔ Agent WebSocket protocol.
- Non-sandbox runs still use the config file input on disk.
- Plugin payloads continue to use `{ name, options }`.
