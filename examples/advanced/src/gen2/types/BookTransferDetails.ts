import type { Recipient } from './Recipient.ts'

export const bookTransferDetailsTypeEnum = {
  BOOK_TRANSFER: 'BOOK_TRANSFER',
} as const

export type BookTransferDetailsTypeEnumKey = (typeof bookTransferDetailsTypeEnum)[keyof typeof bookTransferDetailsTypeEnum]

export type BookTransferDetails = {
  type: BookTransferDetailsTypeEnumKey
  /**
   * @type object
   */
  recipient: Recipient
}
