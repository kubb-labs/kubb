import client from "@kubb/plugin-client/client";
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithForm405 } from "../../models/UpdatePetWithForm";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions, UseQueryResult } from "@tanstack/react-query";
import { queryOptions, useQuery } from "@tanstack/react-query";

 export const updatePetWithFormQueryKey = (pet_id: UpdatePetWithFormPathParams["pet_id"], params?: UpdatePetWithFormQueryParams) => ["v5", { url: "/pet/:pet_id", params: { pet_id: pet_id } }, ...(params ? [params] : [])] as const;

 export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>;

 /**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
async function updatePetWithFormHook(pet_id: UpdatePetWithFormPathParams["pet_id"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${pet_id}`, params, ...config });
    return res.data;
}

 export function updatePetWithFormQueryOptionsHook(pet_id: UpdatePetWithFormPathParams["pet_id"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const queryKey = updatePetWithFormQueryKey(pet_id, params);
    return queryOptions({
        enabled: !!(pet_id),
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return updatePetWithFormHook(pet_id, params, config);
        },
    });
}

 /**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:pet_id}
 */
export function useUpdatePetWithFormHook<TData = UpdatePetWithFormMutationResponse, TQueryData = UpdatePetWithFormMutationResponse, TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>(pet_id: UpdatePetWithFormPathParams["pet_id"], params?: UpdatePetWithFormQueryParams, options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(pet_id, params);
    const query = useQuery({
        ...updatePetWithFormQueryOptionsHook(pet_id, params, config) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, UpdatePetWithForm405> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}