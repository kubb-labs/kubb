import type { VendorResponse } from "./VendorResponse.ts";

export type GetVendorByIdPathParams = {
    /**
     * @type string
    */
    id: string;
};

/**
 * @description Returns a vendor object.
*/
export type GetVendorById200 = VendorResponse;

/**
 * @description Bad request
*/
export type GetVendorById400 = any;

/**
 * @description Unauthorized
*/
export type GetVendorById401 = any;

/**
 * @description Forbidden
*/
export type GetVendorById403 = any;

/**
 * @description Internal server error
*/
export type GetVendorById500 = any;

export type GetVendorByIdQueryResponse = GetVendorById200;

export type GetVendorByIdQuery = {
    Response: GetVendorById200;
    PathParams: GetVendorByIdPathParams;
    Errors: GetVendorById400 | GetVendorById401 | GetVendorById403 | GetVendorById500;
};