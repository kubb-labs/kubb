import process from 'node:process'

/** Runtime operations core reads instead of `process`, so another runtime can provide them. */
export type Host = {
  cwd(): string
  env(): Record<string, string | undefined>
}

export const host: Host = {
  cwd: () => process.cwd(),
  env: () => process.env,
}
