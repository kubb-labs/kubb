import fetch from "../../.kubb/fetcher.ts";
import type { ResponseErrorConfig } from "../../.kubb/fetcher.ts";
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from "../../models/ts/petController/UploadFile.ts";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFileHandler({ petId, data, params }: { petId: UploadFilePathParams["petId"]; data?: UploadFileMutationRequest; params?: UploadFileQueryParams }): Promise<Promise<CallToolResult>> {
  
  
  const requestData = data  
  
  const res = await fetch<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationRequest>({ method : "POST", url : `/pet/${petId}/uploadImage`, baseURL : "https://petstore.swagger.io/v2", params, data : requestData, headers : { 'Content-Type': 'application/octet-stream' } })  
  return {
   content: [
     {
       type: 'text',
       text: JSON.stringify(res.data)
     }
   ]
  }
}