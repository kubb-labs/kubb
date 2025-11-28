import type { CreateTransferRequest } from "./CreateTransferRequest.ts";
import type { Transfer } from "./Transfer.ts";

export type CreateTransferHeaderParams = {
    /**
     * @type string
    */
    "Idempotency-Key": string;
};

/**
 * @description createTransfer 200 response
*/
export type CreateTransfer200 = Transfer;

export type CreateTransferMutationRequest = CreateTransferRequest;

export type CreateTransferMutationResponse = CreateTransfer200;

export type CreateTransferMutation = {
    Response: CreateTransfer200;
    Request: CreateTransferMutationRequest;
    HeaderParams: CreateTransferHeaderParams;
    Errors: any;
};