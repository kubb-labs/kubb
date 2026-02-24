import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

type Options = { sanity?: boolean }

export async function write(path: string, data: string, options: Options = {}): Promise<string | undefined> {
  if (data.trim() === '') {
    return undefined
  }

  const resolved = resolve(path)

  if (typeof Bun !== 'undefined') {
    const file = Bun.file(resolved)
    const oldContent = (await file.exists()) ? await file.text() : null
    if (oldContent === data.trim()) {
      return undefined
    }
    await Bun.write(resolved, data.trim())
    return data.trim()
  }

  try {
    const oldContent = await readFile(resolved, { encoding: 'utf-8' })
    if (oldContent?.toString() === data.trim()) {
      return undefined
    }
  } catch (_err) {
    /* file doesn't exist yet */
  }

  await mkdir(dirname(resolved), { recursive: true })
  await writeFile(resolved, data.trim(), { encoding: 'utf-8' })

  if (options.sanity) {
    const savedData = await readFile(resolved, { encoding: 'utf-8' })

    if (savedData?.toString() !== data.trim()) {
      throw new Error(`Sanity check failed for ${path}\n\nData[${data.length}]:\n${data}\n\nSaved[${savedData.length}]:\n${savedData}\n`)
    }

    return savedData
  }

  return data.trim()
}
