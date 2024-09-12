import client from "@kubb/plugin-client/client";
import useSWR from "custom-swr";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { SWRConfiguration } from "custom-swr";
import type { Key } from "swr";

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "post", url: `/pet/${petId}`, params, ...config });
    return res.data;
}

 export function updatePetWithFormQueryOptions(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    return {
        fetcher: async () => {
            return updatePetWithForm(petId, params, config);
        },
    };
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, options: {
    query?: SWRConfiguration<UpdatePetWithFormMutationResponse, UpdatePetWithForm405>;
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const swrKey = [`/pet/${petId}`, params] as const;
    return useSWR<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, Key>(shouldFetch ? swrKey : null, {
        ...updatePetWithFormQueryOptions(petId, params, config),
        ...queryOptions
    });
}
