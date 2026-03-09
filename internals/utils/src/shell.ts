import { spawn } from 'node:child_process'

/**
 * Tokenizes a shell command string, respecting single and double quotes.
 *
 * @example
 * tokenize('git commit -m "initial commit"')
 * // → ['git', 'commit', '-m', 'initial commit']
 */
export function tokenize(command: string): string[] {
  return (command.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
}

type SpawnOptions = {
  /** Working directory for the child process. Defaults to `process.cwd()`. */
  cwd?: string
  /** Environment variables passed to the child process. Defaults to the parent's `process.env`. */
  env?: NodeJS.ProcessEnv
  /**
   * When `true`, spawns a detached background process and resolves immediately.
   * The child is unref'd so the parent process can exit independently.
   * Defaults to `false` (foreground — inherits stdio and waits for exit).
   */
  detached?: boolean
}

/**
 * Spawns `cmd` with `args` and returns a promise that settles when the child process finishes.
 *
 * Foreground mode (default) inherits the parent's stdio and rejects on non-zero exit or signal.
 * Detached mode spawns the child in its own process group, unref's it, and resolves immediately —
 * the parent can exit without waiting for the child.
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
