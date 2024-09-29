import client from "@kubb/plugin-client/client";
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from "../models/GetPetById";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useQuery, queryOptions } from "@tanstack/vue-query";
import { unref } from "vue";

 export const getPetByIdQueryKey = (petId: MaybeRef<GetPetByIdPathParams["petId"]>) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;

 export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>;

 /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
async function getPetById(petId: GetPetByIdPathParams["petId"], config: Partial<RequestConfig> = {}) {
    const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({ method: "GET", url: `/pet/${petId}`, baseURL: "https://petstore3.swagger.io/api/v3", ...config });
    return res.data;
}

 export function getPetByIdQueryOptions(petId: MaybeRef<GetPetByIdPathParams["petId"]>, config: Partial<RequestConfig> = {}) {
    const queryKey = getPetByIdQueryKey(petId);
    return queryOptions({
        enabled: !!(petId),
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return getPetById(unref(petId), unref(config));
        },
    });
}

 /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function useGetPetById<TData = GetPetByIdQueryResponse, TQueryData = GetPetByIdQueryResponse, TQueryKey extends QueryKey = GetPetByIdQueryKey>(petId: MaybeRef<GetPetByIdPathParams["petId"]>, options: {
    query?: Partial<QueryObserverOptions<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId);
    const query = useQuery({
        ...getPetByIdQueryOptions(petId, config) as unknown as QueryObserverOptions,
        queryKey: queryKey as QueryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryReturnType<TData, GetPetById400 | GetPetById404> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}