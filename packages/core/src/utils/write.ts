/* eslint-disable consistent-return */
import fse from 'fs-extra'

import { format } from './format'

type WriteOptions = {
  format: boolean
}

export const write = async (data: string, path: string, options: WriteOptions = { format: false }) => {
  const formattedData = options.format ? format(data) : data

  try {
    await fse.stat(path)
    const oldContent = await fse.readFile(path, { encoding: 'utf-8' })
    if (oldContent?.toString() === formattedData) {
      return
    }
  } catch (_err) {
    return fse.outputFile(path, formattedData, { encoding: 'utf-8' })
  }

  return fse.outputFile(path, formattedData, { encoding: 'utf-8' })
}

export const clean = async (path: string) => {
  return fse.remove(path)
}
