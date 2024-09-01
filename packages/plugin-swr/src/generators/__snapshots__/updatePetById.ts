import client from "@kubb/plugin-client/client";
import useSWRMutation from "swr/mutation";
import type { RequestConfig } from "@kubb/plugin-client/client";

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${petId}`, params, ...config });
    return res.data;
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, options: {
    mutation?: Parameters<typeof useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, any>>[2];
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const swrKey = [`/pet/${petId}`, params] as const;
    return useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, typeof swrKey | null>(shouldFetch ? swrKey : null, async (_url) => {
        return updatePetWithForm(petId, params, config);
    }, mutationOptions);
}
