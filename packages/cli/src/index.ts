import { createProgram } from './program.ts'

export default async function runCLI(argv?: string[]): Promise<void> {
  await createProgram(argv)
}
