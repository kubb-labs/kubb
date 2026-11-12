import { stripVTControlCharacters } from 'node:util'
import { isRichOutput } from '../utils/env.ts'
import { type Expression, getIntro, wakeUp } from '../loggers/banner.ts'
import { isInteractiveRun } from './intro.ts'

function bannerIntro(version: string, expression: Expression, command: string): string {
  return getIntro({ title: 'Turn your API spec into type-safe code', description: `kubb ${command}`, version, expression })
}

/** Whether the mascot can be drawn: a rich, 256-color terminal wide enough that no line wraps and throws off a redraw. */
function canDrawMascot(version: string, command: string): boolean {
  if (!isRichOutput() || !process.stdout.hasColors(256)) return false

  return stripVTControlCharacters(bannerIntro(version, 'open', command))
    .split('\n')
    .every((line) => line.length <= process.stdout.columns)
}

/**
 * Whether a command opens with the mascot. Only the long-running ones do: `generate`, a Studio
 * session or pairing, and `add` or `update` while they ask questions. Quick commands print only
 * their result.
 */
export function wantsMascot({ commandPath, values }: { commandPath: ReadonlyArray<string>; values: Record<string, unknown> }): boolean {
  const [command, subCommand] = commandPath
  if (values.help || values.version) return false
  if (command === 'studio') return subCommand === undefined || subCommand === 'connect' || subCommand === 'login'
  if (command === 'add' || command === 'update' || command === 'init') return isInteractiveRun({ yes: values.yes, dryRun: values.dryRun ?? values['dry-run'] })

  return command === undefined || command === 'generate'
}

/**
 * The still Kubb mascot with the version and the running command, such as `studio connect`, or a
 * single version line where the terminal cannot draw it. Commands print it as their header; it
 * draws at once, with no wake-up frames.
 */
export function getBanner(version: string, command: string): string {
  return canDrawMascot(version, command) ? `\n${bannerIntro(version, 'open', command)}` : `Kubb CLI v${version}`
}

/** Resolves after `ms`, or as soon as `signal` aborts. */
function pause({ ms, signal }: { ms: number; signal?: AbortSignal }): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    signal?.addEventListener('abort', done)
  })
}

/**
 * Opens `kubb generate` with the mascot playing its wake-up frames in place. Once `signal` aborts,
 * it jumps to the last frame, so the animation never holds up work that is already done.
 * Elsewhere the still {@link getBanner} is the header.
 */
export async function logBanner({ version, signal }: { version: string; signal?: AbortSignal }): Promise<void> {
  if (!canDrawMascot(version, 'generate')) {
    console.log(getBanner(version, 'generate'))

    return
  }

  const [lastExpression] = wakeUp.at(-1)!
  console.log('')
  for (const [index, [expression, ms]] of wakeUp.entries()) {
    const cut = signal?.aborted ?? false
    const frame = bannerIntro(version, cut ? lastExpression : expression, 'generate')
    if (index > 0) process.stdout.moveCursor(0, -frame.split('\n').length)
    console.log(frame)
    if (cut) return
    await pause({ ms, signal })
  }
}
