import type { Command } from 'commander'

import { program } from './program.ts'

export default function runCLI(argv?: readonly string[]): Command {
  return program.parse(argv)
}
