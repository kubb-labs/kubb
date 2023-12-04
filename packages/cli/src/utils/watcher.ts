import c from 'tinyrainbow'

import { spinner } from './spinner.ts'

export async function startWatcher(path: string[], cb: (path: string[]) => Promise<void>): Promise<void> {
  const { watch } = await import('chokidar')

  const ignored = ['**/{.git,node_modules}/**']

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', (type, file) => {
    spinner.succeed(c.yellow(c.bold(`Change detected: ${type} ${file}`)))
    // revert back
    spinner.spinner = 'clock'

    try {
      cb(path)
    } catch (e) {
      spinner.warn(c.red('Watcher failed'))
    }
  })

  return
}
