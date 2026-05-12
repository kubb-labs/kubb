/**
 * Logger adapter selected by `setupLogger` based on the runtime environment.
 * - `'clack'`: TTY-aware output with spinners and progress bars.
 * - `'github-actions'`: CI output using `::group::` annotations.
 * - `'plain'`: Plain `console.log` output for non-TTY environments.
 */
export type LoggerType = 'clack' | 'github-actions' | 'plain'
