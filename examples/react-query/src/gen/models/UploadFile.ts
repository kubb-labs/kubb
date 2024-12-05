import type { ApiResponse } from "./ApiResponse";

 export type UploadFilePathParams = {
    /**
     * @description ID of pet to update
     * @type integer, int64
    */
    petId: number;
};

 export type UploadFileQueryParams = {
    /**
     * @description Additional Metadata
     * @type string | undefined
    */
    additionalMetadata?: string;
};

 /**
 * @description successful operation
*/
export type UploadFile200 = ApiResponse;

 export type UploadFileMutationRequest = Blob;

 export type UploadFileMutationResponse = UploadFile200;

 export type UploadFileMutation = {
    Response: UploadFile200;
    Request: UploadFileMutationRequest;
    PathParams: UploadFilePathParams;
    QueryParams: UploadFileQueryParams;
    Errors: any;
};