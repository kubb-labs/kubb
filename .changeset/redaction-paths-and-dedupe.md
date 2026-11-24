---
'@kubb/cli': patch
'@kubb/studio': patch
'@kubb/core': patch
'@kubb/parser-ts': patch
'@kubb/ast': patch
'@kubb/plugin-barrel': patch
---

Keep secrets and stacks out of logs and Studio, and check paths more carefully.

- `@kubb/cli`: The background Studio worker now redacts a token from a later refresh and the agent key in its log. `KUBB_REGISTRY` must be an `https://` URL, or an `http://` URL on `localhost`, `127.0.0.1` or `[::1]`. `--log-level verbose` sends error stacks to Studio.
- `@kubb/studio`: Generation events no longer send error stacks to Studio unless `connectAgent` gets `debug: true`. An output folder whose name starts with two dots, such as `..cache`, now counts as inside the project.
- `@kubb/core`: A generated file outside `output.path` and `shared.path` reports the `KUBB_OUTSIDE_OUTPUT` warning. Kubb still writes the file.
- `@kubb/parser-ts`: `parserTsx` now has a `version` and `compatibility`, so Kubb checks that it supports the running Kubb version.
- `@kubb/ast`: Adds `ast.file.getRelativePath`, the relative import specifier that `@kubb/parser-ts` now also uses.
- `@kubb/plugin-barrel`: A folder named like `..cache` inside the output no longer fails with `KUBB_PATH_TRAVERSAL`.
