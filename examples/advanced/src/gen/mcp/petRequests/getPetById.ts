import fetch from "../../.kubb/fetcher.ts";
import type { ResponseErrorConfig } from "../../.kubb/fetcher.ts";
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from "../../models/ts/petController/GetPetById.ts";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetByIdHandler({ petId }: { petId: GetPetByIdPathParams["petId"] }): Promise<Promise<CallToolResult>> {
  
  
  const res = await fetch<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({ method : "GET", url : `/pet/${petId}:search`, baseURL : "https://petstore.swagger.io/v2" })  
  return {
   content: [
     {
       type: 'text',
       text: JSON.stringify(res.data)
     }
   ]
  }
}