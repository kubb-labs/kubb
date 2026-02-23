import { readFileSync } from 'node:fs'

export const source = readFileSync(new URL('../../templates/ToZod.ts', import.meta.url), 'utf-8')
