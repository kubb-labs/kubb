import type { Transfer } from './Transfer.ts'

export type PageTransfer = {
  /**
   * @type string
   */
  next_cursor?: string | null
  /**
   * @type array
   */
  items: Transfer[]
}
