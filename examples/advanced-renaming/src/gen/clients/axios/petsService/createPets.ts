import client from "../../../../axios-client.ts";
import type { ResponseConfig } from "../../../../axios-client.ts";
import type { CreatePetsMutationRequest, CreatePetsMutationResponse, CreatePetsPathParams, CreatePetsQueryParams, CreatePetsHeaderParams } from "../../../models/ts/petsController/CreatePets";

/**
     * @summary Create a pet
     * @link /pets/:pet-id */
export async function createPets({ petId }: CreatePetsPathParams, data: CreatePetsMutationRequest, headers: CreatePetsHeaderParams, params?: CreatePetsQueryParams, options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<CreatePetsMutationResponse>> {
    const res = await client<CreatePetsMutationResponse, CreatePetsMutationRequest>({
        method: "post",
        url: `/pets/${petId}`,
        params,
        data,
        headers: { ...headers, ...options.headers },
        ...options
    });
    return res;
}