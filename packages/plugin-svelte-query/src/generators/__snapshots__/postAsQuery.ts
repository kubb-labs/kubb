import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from "custom-query";
import { createQuery, queryOptions } from "custom-query";

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
        queryFn: async () => {
            return updatePetWithForm(petId, data, params, config);
        },
    });
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function createUpdatePetWithForm<TData = UpdatePetWithFormMutationResponse, TQueryData = UpdatePetWithFormMutationResponse, TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>(petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, options: {
    query?: Partial<CreateBaseQueryOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, data, params);
    const query = createQuery({
        ...updatePetWithFormQueryOptions(petId, data, params, config) as unknown as CreateBaseQueryOptions,
        queryKey,
        ...queryOptions as unknown as Omit<CreateBaseQueryOptions, "queryKey">
    }) as CreateQueryResult<TData, UpdatePetWithForm405> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
