---
'@kubb/core': minor
'@kubb/cli': patch
'@kubb/adapter-oas': patch
'@kubb/parser-ts': patch
'@kubb/parser-md': patch
'@kubb/plugin-barrel': patch
---

Report extension crashes with their own diagnostic code and a link to the extension's issue tracker. A plugin crash is now `KUBB_PLUGIN_FAILED` instead of `KUBB_UNKNOWN`, and adapter and parser crashes are the new `KUBB_ADAPTER_FAILED` and `KUBB_PARSER_FAILED`. Set `meta.issues` on an extension and Kubb prints it as a `report:` line under the error, so users report bugs to the extension's maintainers instead of to Kubb. Run with `--verbose` to print the crash's stack trace.
