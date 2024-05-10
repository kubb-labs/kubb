import { resolve } from 'node:path'
import { read, write } from '@kubb/fs'

export async function writeLog(data: string): Promise<string | undefined> {
  if (data.trim() === '') {
    return undefined
  }
  const path = resolve(process.cwd(), 'kubb-log.log')
  let previousLogs = ''

  try {
    previousLogs = await read(resolve(path))
  } catch (_err) {
    /* empty */
  }

  return write(path, [previousLogs, data.trim()].filter(Boolean).join('\n\n\n'), { sanity: false })
}
