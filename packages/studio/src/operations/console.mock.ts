import { vi } from 'vitest'

/**
 * Studio writes to the console, so the console is what tests observe. Spying beats mocking the
 * internal module: it asserts the output a person actually sees, and cannot silently stop applying
 * when the module moves.
 */
export function spyOnConsole() {
  return {
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    table: vi.spyOn(console, 'table').mockImplementation(() => {}),
  }
}
