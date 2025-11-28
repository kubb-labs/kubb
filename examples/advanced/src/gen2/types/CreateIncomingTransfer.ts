import type { CreateIncomingTransferRequest } from "./CreateIncomingTransferRequest.ts";
import type { Transfer } from "./Transfer.ts";

export type CreateIncomingTransferHeaderParams = {
    /**
     * @type string
    */
    "Idempotency-Key": string;
};

/**
 * @description createIncomingTransfer 200 response
*/
export type CreateIncomingTransfer200 = Transfer;

export type CreateIncomingTransferMutationRequest = CreateIncomingTransferRequest;

export type CreateIncomingTransferMutationResponse = CreateIncomingTransfer200;

export type CreateIncomingTransferMutation = {
    Response: CreateIncomingTransfer200;
    Request: CreateIncomingTransferMutationRequest;
    HeaderParams: CreateIncomingTransferHeaderParams;
    Errors: any;
};