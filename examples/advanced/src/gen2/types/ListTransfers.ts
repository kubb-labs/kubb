import type { PageTransfer } from './PageTransfer.ts'

export type ListTransfersQueryParams = {
  /**
   * @type string
   */
  cursor?: string | null
  /**
   * @type integer, int32
   */
  limit?: number | null
}

/**
 * @description Returns a list of transfers.
 */
export type ListTransfers200 = PageTransfer

/**
 * @description Bad request
 */
export type ListTransfers400 = any

/**
 * @description Unauthorized
 */
export type ListTransfers401 = any

/**
 * @description Forbidden
 */
export type ListTransfers403 = any

/**
 * @description Internal server error
 */
export type ListTransfers500 = any

export type ListTransfersQueryResponse = ListTransfers200

export type ListTransfersQuery = {
  Response: ListTransfers200
  QueryParams: ListTransfersQueryParams
  Errors: ListTransfers400 | ListTransfers401 | ListTransfers403 | ListTransfers500
}
