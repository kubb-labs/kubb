import { Writable } from 'node:stream'

import { colors } from 'consola/utils'

import * as process from 'node:process'
import type { WritableOptions } from 'node:stream'
import type { ConsolaInstance } from 'consola'

export class ConsolaWritable extends Writable {
  consola: ConsolaInstance | undefined
  command: string
  constructor(consola: ConsolaInstance | undefined, command: string, opts?: WritableOptions) {
    super(opts)

    this.command = command
    this.consola = consola
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    process.stdout.write(`${colors.dim(chunk?.toString())}`)

    callback()
  }
}
