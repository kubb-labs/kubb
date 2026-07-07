---
'@kubb/cli': patch
'kubb': patch
---

Fix `kubb generate` (and `kubb <path>`) misreading the OpenAPI input override.

The `generate` command was omitted from the CLI's registered subcommands, so gunshi fell back to running it as the entry command without stripping the `generate` token from the argument list. Combined with the command reading the raw, unstripped positional list instead of its resolved `input` value, every invocation of `kubb generate --config kubb.config.ts` (with or without a config file) treated the literal word `generate` as an OpenAPI path override, which then failed with `KUBB_INPUT_NOT_FOUND`.

`kubb generate`, `kubb generate ./openapi.yaml`, and bare `kubb --config kubb.config.ts` all resolve the input path correctly now.
