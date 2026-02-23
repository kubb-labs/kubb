import { readFileSync } from 'node:fs'

export const source = readFileSync(new URL('../../../templates/clients/fetch.ts', import.meta.url), 'utf-8')
