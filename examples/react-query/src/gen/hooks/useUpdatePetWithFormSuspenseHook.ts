import client from "@kubb/plugin-client/client";
import type { UpdatePetWithFormMutationResponse, UpdatePetWithFormPathParams, UpdatePetWithFormQueryParams, UpdatePetWithForm405 } from "../models/UpdatePetWithForm.ts";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from "@tanstack/react-query";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";

 export const updatePetWithFormSuspenseQueryKey = (petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : [])] as const;

 export type UpdatePetWithFormSuspenseQueryKey = ReturnType<typeof updatePetWithFormSuspenseQueryKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${petId}`, baseURL: "https://petstore3.swagger.io/api/v3", params, ...config });
    return res.data;
}

 export function updatePetWithFormSuspenseQueryOptions(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const queryKey = updatePetWithFormSuspenseQueryKey(petId, params);
    return queryOptions({
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return updatePetWithForm(petId, params, config);
        },
    });
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithFormSuspenseHook<TData = UpdatePetWithFormMutationResponse, TQueryData = UpdatePetWithFormMutationResponse, TQueryKey extends QueryKey = UpdatePetWithFormSuspenseQueryKey>(petId: UpdatePetWithFormPathParams["petId"], params?: UpdatePetWithFormQueryParams, options: {
    query?: Partial<UseSuspenseQueryOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? updatePetWithFormSuspenseQueryKey(petId, params);
    const query = useSuspenseQuery({
        ...updatePetWithFormSuspenseQueryOptions(petId, params, config) as unknown as UseSuspenseQueryOptions,
        queryKey,
        ...queryOptions as unknown as Omit<UseSuspenseQueryOptions, "queryKey">
    }) as UseSuspenseQueryResult<TData, UpdatePetWithForm405> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}