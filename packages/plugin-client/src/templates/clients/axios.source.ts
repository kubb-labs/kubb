import { readFileSync } from 'node:fs'

export const source = readFileSync(new URL('../../../templates/clients/axios.ts', import.meta.url), 'utf-8')
