import type { WritableOptions } from 'node:stream'
import { Writable } from 'node:stream'
import type * as clack from '@clack/prompts'
import pc from 'picocolors'

export class ClackWritable extends Writable {
  taskLog: ReturnType<typeof clack.taskLog>
  constructor(taskLog: ReturnType<typeof clack.taskLog>, opts?: WritableOptions) {
    super(opts)

    this.taskLog = taskLog
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.taskLog.message(`${pc.dim(chunk?.toString())}`)
    callback()
  }
}
