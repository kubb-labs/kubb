import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from "custom-query";
import type { MaybeRef } from "vue";
import { useQuery, queryOptions } from "custom-query";
import { unref } from "vue";

 export const updatePetWithFormQueryKey = (petId: MaybeRef<UpdatePetWithFormPathParams["petId"]>, data?: MaybeRef<UpdatePetWithFormMutationRequest>, params?: MaybeRef<UpdatePetWithFormQueryParams>) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : []), ...(data ? [data] : [])] as const;

 export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>({ method: "POST", url: `/pet/${petId}`, params, data, ...config });
    return updatePetWithFormMutationResponse.parse(res.data);
}

 export function updatePetWithFormQueryOptions(petId: MaybeRef<UpdatePetWithFormPathParams["petId"]>, data?: MaybeRef<UpdatePetWithFormMutationRequest>, params?: MaybeRef<UpdatePetWithFormQueryParams>, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const queryKey = updatePetWithFormQueryKey(petId, data, params);
    return queryOptions({
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return updatePetWithForm(unref(petId), unref(data), unref(params), unref(config));
        },
    });
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TQueryData = UpdatePetWithFormMutationResponse, TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>(petId: MaybeRef<UpdatePetWithFormPathParams["petId"]>, data?: MaybeRef<UpdatePetWithFormMutationRequest>, params?: MaybeRef<UpdatePetWithFormQueryParams>, options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, data, params);
    const query = useQuery({
        ...updatePetWithFormQueryOptions(petId, data, params, config) as unknown as QueryObserverOptions,
        queryKey: queryKey as QueryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryReturnType<TData, UpdatePetWithForm405> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
