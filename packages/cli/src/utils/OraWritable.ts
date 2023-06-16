/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type { WritableOptions } from 'node:stream'
import { Writable } from 'node:stream'
import type { Ora } from 'ora'
import pc from 'picocolors'

export class OraWritable extends Writable {
  public command: string
  public spinner: Ora
  constructor(spinner: Ora, command: string, opts?: WritableOptions) {
    super(opts)

    this.command = command
    this.spinner = spinner
  }
  _write(chunk: any, _encoding: NodeJS.BufferEncoding, callback: (error?: Error | null) => void): void {
    this.spinner.suffixText = `\n\n${pc.bold(pc.blue(this.command))}: ${chunk?.toString()}`

    callback()
  }
}
