import type { UpdateVendorRequest } from './UpdateVendorRequest.ts'
import type { VendorResponse } from './VendorResponse.ts'

export type UpdateVendorPathParams = {
  /**
   * @type string
   */
  id: string
}

export type UpdateVendorHeaderParams = {
  /**
   * @type string
   */
  'Idempotency-Key'?: string | null
}

/**
 * @description updateVendor 200 response
 */
export type UpdateVendor200 = VendorResponse

export type UpdateVendorMutationRequest = UpdateVendorRequest

export type UpdateVendorMutationResponse = UpdateVendor200

export type UpdateVendorMutation = {
  Response: UpdateVendor200
  Request: UpdateVendorMutationRequest
  PathParams: UpdateVendorPathParams
  HeaderParams: UpdateVendorHeaderParams
  Errors: any
}
