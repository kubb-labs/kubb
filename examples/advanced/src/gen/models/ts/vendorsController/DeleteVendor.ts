export type DeleteVendorPathParams = {
  /**
   * @type string
   */
  id: string
}

/**
 * @description deleteVendor 200 response
 */
export type DeleteVendor200 = any

export type DeleteVendorMutationResponse = DeleteVendor200

export type DeleteVendorMutation = {
  Response: DeleteVendor200
  PathParams: DeleteVendorPathParams
  Errors: any
}
