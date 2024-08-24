import { Writable } from 'node:stream'

import c from 'tinyrainbow'

import type { WritableOptions } from 'node:stream'
import type { ConsolaInstance } from 'consola'

export class BasicWritables extends Writable {
  #frame = 'Loading ...'
  set frame(frame: string) {
    this.#frame = frame
  }
  get frame() {
    return this.#frame
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (chunk?.toString() !== this.frame && chunk?.toString()) {
      this.frame = chunk?.toString()
    }

    callback()
  }
}

export class ConsolaWritable extends Writable {
  consola: ConsolaInstance
  command: string
  constructor(consola: ConsolaInstance, command: string, opts?: WritableOptions) {
    super(opts)

    this.command = command
    this.consola = consola
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (this.command) {
      this.consola.log(`${c.bold(c.blue(this.command))}: ${chunk?.toString()}`)
    } else {
      this.consola.log(`${c.bold(c.blue(this.command))}: ${chunk?.toString()}`)
    }

    callback()
  }
}
