import type EventEmitter from 'eventemitter3'
import type { File, Status, UUID } from './types'

const keys = {
  getFileKey: () => `file`,
  getStatusChangeKey: () => `status-change`,
  getStatusChangeByIdKey: (id: string) => `${id}-status-change`,
  getSuccessKey: () => `success`,
  getRemoveKey: (id: string) => `${id}remove`,
} as const

type VoidFunction = () => void

export function getFileManagerEvents(emitter: EventEmitter) {
  return {
    /**
     * Emiter
     */
    emitFile: (id: UUID, file: File): void => {
      emitter.emit(keys.getFileKey(), id, file)
    },
    emitStatusChange: (file: File): void => {
      emitter.emit(keys.getStatusChangeKey(), file)
    },
    emitStatusChangeById: (id: UUID, status: Status): void => {
      emitter.emit(keys.getStatusChangeByIdKey(id), status)
    },
    emitSuccess: (): void => {
      emitter.emit(keys.getSuccessKey())
    },
    emitRemove: (id: UUID, file: File): void => {
      emitter.emit(keys.getRemoveKey(id), file)
    },
    /**
     * Listeners
     */

    onAdd: (callback: (id: UUID, file: File) => void): VoidFunction => {
      emitter.on(keys.getFileKey(), callback)
      return () => emitter.removeListener(keys.getFileKey(), callback)
    },
    onStatusChange: (callback: (file: File) => void): VoidFunction => {
      emitter.on(keys.getStatusChangeKey(), callback)
      return () => emitter.removeListener(keys.getStatusChangeKey(), callback)
    },
    onStatusChangeById: (id: UUID, callback: (status: Status) => void): VoidFunction => {
      emitter.on(keys.getStatusChangeByIdKey(id), callback)
      return () => emitter.removeListener(keys.getStatusChangeByIdKey(id), callback)
    },
    onSuccess: (callback: () => void): VoidFunction => {
      emitter.on(keys.getSuccessKey(), callback)
      return () => emitter.removeListener(keys.getSuccessKey(), callback)
    },
    onRemove: (id: UUID, callback: (file: File) => void): VoidFunction => {
      emitter.on(keys.getRemoveKey(id), callback)
      return () => emitter.removeListener(keys.getRemoveKey(id), callback)
    },
  }
}
