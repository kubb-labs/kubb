---
'@kubb/adapter-oas': minor
'@kubb/core': minor
'@kubb/cli': minor
---

Replace the debug logger with selectable reporters.

The `kubb:debug` hook, the `createDebugger` helper, the `debug` log level, and the `--debug` flag are gone. To write a log file you now pick the `file` reporter.

Reporters work like Vitest. List them on the CLI with `--reporter` (comma separated, for example `--reporter cli,file`) or in the config with `reporters: ['cli', 'file']`, where the CLI flag overrides the config. Three are built in: `cli` writes the end-of-run summary to the terminal and is the default, `json` writes a machine-readable report to stdout for CI, and `file` writes a log to `.kubb/<name>-<timestamp>.log`. The `--reporter human` name and the `--report <file>` flag are removed, so use `--reporter json` for CI output.

The OAS adapter's advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT` and `KUBB_DEPRECATED`) always run now. The `adapterOas({ diagnostics })` option that gated them is removed.

The `kubb:generation:summary` hook is removed. The end-of-run summary the `cli` reporter prints is now built from the run's diagnostics, carried on `kubb:generation:end` (which gains optional `diagnostics`, `status`, `hrStart`, and `filesCreated` fields).
