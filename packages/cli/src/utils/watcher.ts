import pc from 'picocolors'

import type { Ora } from 'ora'

type Options = {
  path: string[]
  spinner: Ora
}
export async function startWatcher(cb: (path: string[]) => Promise<void>, options: Options) {
  const { spinner, path } = options
  const { watch } = await import('chokidar')

  const ignored = ['**/{.git,node_modules}/**']

  const watcher = watch(path, {
    ignorePermissionErrors: true,
    ignored,
  })
  watcher.on('all', (type, file) => {
    spinner.succeed(pc.yellow(pc.bold(`Change detected: ${type} ${file}`)))
    // revert back
    spinner.spinner = 'clock'

    try {
      cb(options.path)
    } catch (e) {
      spinner.warn(pc.red('Watcher failed'))
    }
  })
}
