import type { PageVendorResponse } from '../PageVendorResponse.ts'

export type ListVendorsQueryParams = {
  /**
   * @type string
   */
  cursor?: string | null
  /**
   * @type integer, int32
   */
  limit?: number | null
  /**
   * @type string
   */
  name?: string | null
}

/**
 * @description Returns a list of vendor objects.
 */
export type ListVendors200 = PageVendorResponse

/**
 * @description Bad request
 */
export type ListVendors400 = any

/**
 * @description Unauthorized
 */
export type ListVendors401 = any

/**
 * @description Forbidden
 */
export type ListVendors403 = any

export type ListVendorsQueryResponse = ListVendors200

export type ListVendorsQuery = {
  Response: ListVendors200
  QueryParams: ListVendorsQueryParams
  Errors: ListVendors400 | ListVendors401 | ListVendors403
}
