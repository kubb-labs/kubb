import process from 'node:process'
import pc from 'picocolors'
import { parseHrtimeToSeconds } from './parseHrtimeToSeconds.ts'

type ProgressState = {
  totalPlugins: number
  completedPlugins: number
  currentPlugin?: string
  totalFiles: number
  processedFiles: number
  hrStart: [number, number]
  phase: 'config' | 'generation' | 'files' | 'format' | 'lint' | 'hooks' | 'complete'
}

export class ProgressIndicator {
  private state: ProgressState
  private isTTY: boolean
  private lastLineLength = 0

  constructor(isTTY = process.stdout.isTTY || false) {
    this.isTTY = isTTY
    this.state = {
      totalPlugins: 0,
      completedPlugins: 0,
      totalFiles: 0,
      processedFiles: 0,
      hrStart: process.hrtime(),
      phase: 'config',
    }
  }

  start(totalPlugins: number, hrStart: [number, number]): void {
    this.state.totalPlugins = totalPlugins
    this.state.completedPlugins = 0
    this.state.hrStart = hrStart
    this.state.phase = 'generation'
  }

  updatePlugin(pluginName: string): void {
    this.state.currentPlugin = pluginName
    this.render()
  }

  completePlugin(): void {
    this.state.completedPlugins++
    this.state.currentPlugin = undefined
    this.render()
  }

  startFiles(totalFiles: number): void {
    this.state.totalFiles = totalFiles
    this.state.processedFiles = 0
    this.state.phase = 'files'
    this.render()
  }

  updateFile(): void {
    this.state.processedFiles++
    this.render()
  }

  setPhase(phase: ProgressState['phase']): void {
    this.state.phase = phase
    this.render()
  }

  clear(): void {
    if (this.isTTY && this.lastLineLength > 0) {
      // Clear the current line
      process.stdout.write('\r' + ' '.repeat(this.lastLineLength) + '\r')
      this.lastLineLength = 0
    }
  }

  private render(): void {
    if (!this.isTTY) {
      return
    }

    const parts: string[] = []
    const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(this.state.hrStart))

    // Phase indicator
    if (this.state.phase === 'generation' && this.state.totalPlugins > 0) {
      const pluginProgress = `${pc.green(this.state.completedPlugins.toString())}/${this.state.totalPlugins}`
      parts.push(`Plugins ${pluginProgress}`)

      if (this.state.currentPlugin) {
        parts.push(pc.dim(this.state.currentPlugin))
      }
    } else if (this.state.phase === 'files' && this.state.totalFiles > 0) {
      const fileProgress = `${pc.green(this.state.processedFiles.toString())}/${this.state.totalFiles}`
      parts.push(`Files ${fileProgress}`)
    } else if (this.state.phase === 'format') {
      parts.push(pc.yellow('Formatting...'))
    } else if (this.state.phase === 'lint') {
      parts.push(pc.yellow('Linting...'))
    } else if (this.state.phase === 'hooks') {
      parts.push(pc.yellow('Running hooks...'))
    } else if (this.state.phase === 'config') {
      parts.push(pc.yellow('Loading config...'))
    }

    // Time
    parts.push(pc.dim(`${elapsedSeconds}s`))

    const line = parts.join(pc.dim(' | '))
    const lineLength = this.stripAnsi(line).length

    // Clear previous line and write new one
    if (this.lastLineLength > 0) {
      process.stdout.write('\r' + ' '.repeat(this.lastLineLength) + '\r')
    }
    process.stdout.write(line)

    this.lastLineLength = lineLength
  }

  private stripAnsi(str: string): string {
    // Simple ANSI code stripper for length calculation
    return str.replace(/\u001b\[[0-9;]*m/g, '')
  }
}
