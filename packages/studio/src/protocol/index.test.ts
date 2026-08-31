import { describe, expect, it } from 'vitest'
import type { AgentMessage } from './index.ts'
import { isCommandMessage, isDataMessage, isDisconnectMessage } from './index.ts'

describe('agent protocol', () => {
  describe('message type guards', () => {
    it('identifies command messages', () => {
      const message: AgentMessage = {
        type: 'command',
        command: 'generate',
        payload: {},
      }

      expect(isCommandMessage(message)).toBe(true)
      expect(isDataMessage(message)).toBe(false)
    })

    it('identifies data messages', () => {
      const message: AgentMessage = {
        type: 'data',
        payload: {
          type: 'kubb:info',
          data: [{ message: 'message' }],
          timestamp: Date.now(),
          seq: 0,
        },
      }

      expect(isDataMessage(message)).toBe(true)
      expect(isCommandMessage(message)).toBe(false)

      const event = isDataMessage(message, 'kubb:info') ? message : undefined
      expect(event?.payload.type).toStrictEqual('kubb:info')
    })

    it('identifies a disconnect message and carries its reason', () => {
      const message: AgentMessage = { type: 'disconnect', reason: 'revoked' }

      expect(isDisconnectMessage(message)).toBe(true)
      expect(isCommandMessage(message)).toBe(false)
      expect(isDataMessage(message)).toBe(false)
      if (isDisconnectMessage(message)) {
        expect(message.reason).toBe('revoked')
      }
    })
  })
})
