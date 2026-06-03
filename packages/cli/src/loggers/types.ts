/**
 * Logger adapter selected by `setupReporters` based on the runtime environment.
 * - `'clack'`: TTY-aware output with spinners and progress bars.
 * - `'plain'`: Plain `console.log` output for non-TTY environments.
 */
export type LoggerType = 'clack' | 'plain'
