import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions, UseQueryResult } from "custom-query";
import { useQuery, queryOptions } from "custom-query";

 export const updatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : []), ...(data ? [data] : [])] as const;

 export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>({ method: "POST", url: `/pet/${petId}`, params, data, ...config });
    return updatePetWithFormMutationResponse.parse(res.data);
}

 export function updatePetWithFormQueryOptions(petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const queryKey = updatePetWithFormQueryKey(petId, data, params);
    return queryOptions({
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return updatePetWithForm(petId, data, params, config);
        },
    });
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TQueryData = UpdatePetWithFormMutationResponse, TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>(petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, data, params);
    const query = useQuery({
        ...updatePetWithFormQueryOptions(petId, data, params, config) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, UpdatePetWithForm405> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
