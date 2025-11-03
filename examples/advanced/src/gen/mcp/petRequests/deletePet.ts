import fetch from "../../.kubb/fetcher.ts";
import type { ResponseErrorConfig } from "../../.kubb/fetcher.ts";
import type { DeletePetMutationResponse, DeletePetPathParams, DeletePetHeaderParams, DeletePet400 } from "../../models/ts/petController/DeletePet.ts";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export async function deletePetHandler({ petId, headers }: { petId: DeletePetPathParams["petId"]; headers?: DeletePetHeaderParams }): Promise<Promise<CallToolResult>> {
  
  
  const res = await fetch<DeletePetMutationResponse, ResponseErrorConfig<DeletePet400>, unknown>({ method : "DELETE", url : `/pet/${petId}:search`, baseURL : "https://petstore.swagger.io/v2", headers : { ...headers } })  
  return {
   content: [
     {
       type: 'text',
       text: JSON.stringify(res.data)
     }
   ]
  }
}