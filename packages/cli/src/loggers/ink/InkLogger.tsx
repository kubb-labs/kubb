import React, { useState, useCallback, useRef, useLayoutEffect } from 'react'
import { Box, Static, Text, useApp } from 'ink'
import { Header } from './components/Header.tsx'
import { type LoggerContext, LogLevel } from '@kubb/core'
import { getSummary } from '../../utils/getSummary.ts'
import { formatMsWithColor } from '../../utils/formatMsWithColor.ts'
import { execa } from 'execa'
import { Writable } from 'node:stream'
import pc from 'picocolors'

type Props = {
  context: LoggerContext
  logLevel: LogLevel
}

type ProgressState = {
  current: number
  total: number
  message: string
}

class LogWritable extends Writable {
  constructor(private addLog: (msg: string) => void) {
    super()
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.addLog(`${pc.dim(chunk?.toString().trim())}`)
    callback()
  }
}

export const InkLogger = ({ context, logLevel }: Props) => {
  const { exit } = useApp()

  const [logs, setLogs] = useState<{ id: number; text: string }[]>([])
  const [spinnerMessage, setSpinnerMessage] = useState<string | undefined>()
  const [progress, setProgress] = useState<ProgressState | undefined>()
  const [projectName, setProjectName] = useState<string | undefined>()
  const [summary, setSummary] = useState<string[] | undefined>()
  const [hasError, setHasError] = useState(false)

  // Ref to keep track of current props/state in async callbacks if needed
  const logLevelRef = useRef(logLevel)
  logLevelRef.current = logLevel
  const logIdRef = useRef(0)

  const addLog = useCallback((msg: string) => {
     setLogs(prev => [...prev, { id: logIdRef.current++, text: msg }])
  }, [])

  useLayoutEffect(() => {
    const onInfo = (message: string, info = '') => {
        // if (logLevel > LogLevel.silent) {
        //    addLog(`${pc.blue('ℹ')} ${message} ${pc.dim(info)}`)
        // }
    }
    const onSuccess = (message: string, info = '') => {
        // if (logLevel > LogLevel.silent) {
        //    addLog(`${pc.green('✓')} ${message} ${pc.dim(info)}`)
        // }
    }
    const onWarn = (message: string, info = '') => {
        // if (logLevel >= LogLevel.warn) {
        //    addLog(`${pc.yellow('⚠')} ${message} ${pc.dim(info)}`)
        // }
    }
    const onError = (error: Error) => {
        addLog(`${pc.red('✗')} ${error.message}`)
        if (logLevel >= LogLevel.debug && error.stack) {
             const frames = error.stack.split('\n').slice(1, 4)
             frames.forEach(frame => addLog(pc.dim(frame.trim())))
        }
    }

    const onGenerationStart = (config: any) => {
        setProjectName(config.name)
        setSpinnerMessage('Starting generation...')
        setLogs([]) // Clear logs on start
        setSummary(undefined)
        setHasError(false)
        logIdRef.current = 0
    }

    const onPluginStart = (plugin: any) => {
        setSpinnerMessage(`Generating ${plugin.name}...`)
    }

    const onPluginEnd = (plugin: any, { success, duration }: any) => {
        const durationStr = formatMsWithColor(duration)
        if (success) {
            addLog(`${pc.green('✓')} Generated ${plugin.name} ${pc.dim(durationStr)}`)
        } else {
            addLog(`${pc.red('✗')} Failed ${plugin.name} ${pc.dim(durationStr)}`)
        }
    }

    const onFilesStart = (files: any[]) => {
        setProgress({
            current: 0,
            total: files.length,
            message: `Writing ${files.length} files`
        })
        setSpinnerMessage(undefined)
    }

    const onFileUpdate = ({ file }: any) => {
        setProgress(prev => prev ? { ...prev, current: prev.current + 1 } : undefined)
    }

    const onFilesEnd = () => {
        setProgress(undefined)
        addLog(`${pc.green('✓')} Files written`)
    }

    const onHookStart = async ({ id, command, args }: any) => {
        const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
        addLog(`${pc.dim('Hook')} ${commandWithArgs} started`)

        if (!id) return

        const writable = new LogWritable(addLog)

        try {
            const result = await execa(command, args, {
                detached: true,
                stdout: ['pipe', writable],
                stripFinalNewline: true,
            })

            await context.emit('debug', {
                date: new Date(),
                logs: [result.stdout],
            })

            await context.emit('hook:end', { command, args, id, success: true, error: null })
        } catch (err: any) {
            const error = new Error('Hook execute failed')
            error.cause = err

            await context.emit('debug', {
                date: new Date(),
                logs: [err.stdout],
            })

            await context.emit('hook:end', { command, args, id, success: true, error })
            await context.emit('error', error)
        }
    }

    const onHookEnd = ({ command, args, success }: any) => {
         const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
         if (success) {
             addLog(`${pc.green('✓')} Hook ${commandWithArgs} completed`)
         } else {
             addLog(`${pc.red('✗')} Hook ${commandWithArgs} failed`)
         }
    }

    const onGenerationSummary = (config: any, { pluginTimings, status, hrStart, failedPlugins, filesCreated }: any) => {
         const summaryLines = getSummary({
            failedPlugins,
            filesCreated,
            config,
            status,
            hrStart,
            pluginTimings: logLevelRef.current >= LogLevel.verbose ? pluginTimings : undefined,
         })

         setSummary(summaryLines)
         setHasError(status !== 'success')
         setSpinnerMessage(undefined)
       setTimeout(()=>{
         exit()
       },0)
    }

    context.on('info', onInfo)
    context.on('success', onSuccess)
    context.on('warn', onWarn)
    context.on('error', onError)
    context.on('generation:start', onGenerationStart)
    context.on('plugin:start', onPluginStart)
    context.on('plugin:end', onPluginEnd)
    context.on('files:processing:start', onFilesStart)
    context.on('file:processing:update', onFileUpdate)
    context.on('files:processing:end', onFilesEnd)
    context.on('hook:start', onHookStart)
    context.on('hook:end', onHookEnd)
    context.on('generation:summary', onGenerationSummary)

    return () => {
        context.removeListener('info', onInfo)
        context.removeListener('success', onSuccess)
        context.removeListener('warn', onWarn)
        context.removeListener('error', onError)
        context.removeListener('generation:start', onGenerationStart)
        context.removeListener('plugin:start', onPluginStart)
        context.removeListener('plugin:end', onPluginEnd)
        context.removeListener('files:processing:start', onFilesStart)
        context.removeListener('file:processing:update', onFileUpdate)
        context.removeListener('files:processing:end', onFilesEnd)
        context.removeListener('hook:start', onHookStart)
        context.removeListener('hook:end', onHookEnd)
        context.removeListener('generation:summary', onGenerationSummary)
    }

  }, [context, logLevel, addLog, exit])

  return (
    <>
      <Static items={logs}>
        {(log) => <Text key={log.id}>{log.text}</Text>}
      </Static>

      <Box flexDirection="column" padding={1}>
        <Header projectName={projectName} spinnerMessage={spinnerMessage} progress={progress} />
        {summary && (
             <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor={hasError ? 'red' : 'green'} paddingX={1}>
                 {summary.map((line, i) => <Text key={i}>{line}</Text>)}
             </Box>
        )}
      </Box>
    </>
  )
}
