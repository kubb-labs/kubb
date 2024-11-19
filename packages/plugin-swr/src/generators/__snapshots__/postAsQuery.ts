import client from "@kubb/plugin-client/client";
import useSWR from "custom-swr";
import type { RequestConfig } from "@kubb/plugin-client/client";

 export const updatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : [])] as const;

 export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>;

 /**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
async function updatePetWithForm({ petId, params }: {
    petId: UpdatePetWithFormPathParams["petId"];
    params?: UpdatePetWithFormQueryParams;
}, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${petId}`, params, ...config });
    return res.data;
}

 export function updatePetWithFormQueryOptions({ petId, params }: {
    petId: UpdatePetWithFormPathParams["petId"];
    params?: UpdatePetWithFormQueryParams;
}, config: Partial<RequestConfig> = {}) {
    return {
        fetcher: async () => {
            return updatePetWithForm({ petId, params }, config);
        },
    };
}

 /**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithForm({ petId, params }: {
    petId: UpdatePetWithFormPathParams["petId"];
    params?: UpdatePetWithFormQueryParams;
}, options: {
    query?: Parameters<typeof useSWR<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormQueryKey | null, any>>[2];
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const queryKey = updatePetWithFormQueryKey(petId, params);
    return useSWR<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormQueryKey | null>(shouldFetch ? queryKey : null, {
        ...updatePetWithFormQueryOptions({ petId, params }, config),
        ...queryOptions
    });
}
