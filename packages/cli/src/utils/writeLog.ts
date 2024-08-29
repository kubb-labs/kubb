import { resolve } from 'node:path'
import { read, write } from '@kubb/fs'

type Props = {
  data: string
  fileName?: string
  override?: boolean
}

export async function writeLog({ data, override, fileName = 'kubb.log' }: Props): Promise<string | undefined> {
  if (data.trim() === '') {
    return undefined
  }
  const path = resolve(process.cwd(), fileName)
  let previousLogs = ''

  try {
    previousLogs = await read(resolve(path))
  } catch (_err) {
    /* empty */
  }

  if (override) {
    return write(path, data.trim(), { sanity: false })
  }

  return write(path, [previousLogs, data.trim()].filter(Boolean).join('\n'), { sanity: false })
}
