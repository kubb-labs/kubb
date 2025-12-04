import type { BankConnection } from './BankConnection.ts'

export type PageBankConnection = {
  /**
   * @type string
   */
  next_cursor?: string | null
  /**
   * @type array
   */
  items: BankConnection[]
}
