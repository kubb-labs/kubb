import { spawn } from 'node:child_process'

/**
 * Tokenizes a shell command string, respecting single and double quotes.
 *
 * @example
 * tokenize('git commit -m "initial commit"')
 * // → ['git', 'commit', '-m', 'initial commit']
 */
export function tokenize(command: string): string[] {
  const args: string[] = []
  let current = ''
  let quote = ''

  for (const ch of command) {
    if (quote) {
      if (ch === quote) quote = ''
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === ' ' || ch === '\t') {
      if (current) {
        args.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }

  if (current) args.push(current)
  return args
}

type SpawnOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  /**
   * When `true`, spawns a detached background process and resolves immediately.
   * The child is unref'd so the parent process can exit independently.
   * Defaults to `false` (foreground — inherits stdio and waits for exit).
   */
  detached?: boolean
}

/**
 * Spawns `cmd args` and returns a promise.
 * - Foreground (default): inherits stdio and resolves when the process exits successfully.
 * - Detached: spawns in its own process group, un-refs the child, and resolves immediately.
 */
export function spawnAsync(cmd: string, args: string[], options: SpawnOptions = {}): Promise<void> {
  const { cwd = process.cwd(), env, detached = false } = options

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: detached ? 'ignore' : 'inherit',
      cwd,
      env,
      detached,
    })

    if (detached) {
      child.unref()
      resolve()
      return
    }

    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve()
      } else if (signal !== null) {
        reject(new Error(`"${cmd} ${args.join(' ')}" was terminated by signal ${signal}`))
      } else {
        reject(new Error(`"${cmd} ${args.join(' ')}" exited with code ${code}`))
      }
    })
    child.on('error', reject)
  })
}
