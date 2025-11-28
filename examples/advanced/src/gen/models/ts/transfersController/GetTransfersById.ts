import type { Transfer } from '../Transfer.ts'

export type GetTransfersByIdPathParams = {
  /**
   * @type string
   */
  id: string
}

/**
 * @description Returns a transfer.
 */
export type GetTransfersById200 = Transfer

/**
 * @description Bad request
 */
export type GetTransfersById400 = any

/**
 * @description Unauthorized
 */
export type GetTransfersById401 = any

/**
 * @description Forbidden
 */
export type GetTransfersById403 = any

/**
 * @description Internal server error
 */
export type GetTransfersById500 = any

export type GetTransfersByIdQueryResponse = GetTransfersById200

export type GetTransfersByIdQuery = {
  Response: GetTransfersById200
  PathParams: GetTransfersByIdPathParams
  Errors: GetTransfersById400 | GetTransfersById401 | GetTransfersById403 | GetTransfersById500
}
