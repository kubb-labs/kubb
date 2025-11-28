import type { CreateVendorRequest } from "./CreateVendorRequest.ts";
import type { VendorResponse } from "./VendorResponse.ts";

export type CreateVendorHeaderParams = {
    /**
     * @type string
    */
    "Idempotency-Key": string;
};

/**
 * @description createVendor 200 response
*/
export type CreateVendor200 = VendorResponse;

export type CreateVendorMutationRequest = CreateVendorRequest;

export type CreateVendorMutationResponse = CreateVendor200;

export type CreateVendorMutation = {
    Response: CreateVendor200;
    Request: CreateVendorMutationRequest;
    HeaderParams: CreateVendorHeaderParams;
    Errors: any;
};