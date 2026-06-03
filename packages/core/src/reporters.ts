/**
 * A built-in reporter that renders a run's output.
 *
 * - `cli` writes the end-of-run summary to the terminal (the default).
 * - `json` writes a machine-readable report to stdout, for CI.
 * - `file` writes a debug log to `.kubb/<name>-<timestamp>.log`.
 */
export type ReporterName = 'cli' | 'json' | 'file'
