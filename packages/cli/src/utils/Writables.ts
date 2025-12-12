import * as process from 'node:process'
import type { WritableOptions } from 'node:stream'
import { Writable } from 'node:stream'
import pc from 'picocolors'

export class ConsolaWritable extends Writable {
  command: string
  constructor(command: string, opts?: WritableOptions) {
    super(opts)

    this.command = command
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    process.stdout.write(`${pc.dim(chunk?.toString())}`)

    callback()
  }
}
