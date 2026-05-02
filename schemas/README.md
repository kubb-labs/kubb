# Schemas

## `extension.json`

Unified schema for Kubb extension manifests (`extension.yaml`). Covers all four extension kinds via the `kind` discriminator: `plugin`, `adapter`, `middleware`, `parser`.

## Registry schemas

| File | Description |
|------|-------------|
| `plugins/plugins.json` | Aggregated plugin registry |
| `adapters/adapters.json` | Aggregated adapter registry |
| `parsers/parsers.json` | Aggregated parser registry |
| `middlewares/middlewares.json` | Aggregated middleware registry |
