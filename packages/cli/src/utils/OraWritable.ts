/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Writable } from 'node:stream'

import c from 'tinyrainbow'

import type { WritableOptions } from 'node:stream'
import type { Ora } from 'ora'

export class OraWritable extends Writable {
  public command: string
  public spinner: Ora
  constructor(spinner: Ora, command: string, opts?: WritableOptions) {
    super(opts)

    this.command = command
    this.spinner = spinner
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.spinner.suffixText = `\n\n${c.bold(c.blue(this.command))}: ${chunk?.toString()}`

    callback()
  }
}
