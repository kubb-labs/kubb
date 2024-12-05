import client from "@kubb/plugin-client/client";
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from "../../models/GetPetById";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions, UseQueryResult } from "@tanstack/react-query";
import { queryOptions, useQuery } from "@tanstack/react-query";

 export const getPetByIdQueryKey = ({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}) => ["v5", { url: "/pet/:pet_id", params: { pet_id: pet_id } }] as const;

 export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>;

 /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:pet_id}
 */
async function getPetByIdHook({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}, config: Partial<RequestConfig> = {}) {
    const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({ method: "GET", url: `/pet/${pet_id}`, ...config });
    return res.data;
}

 export function getPetByIdQueryOptionsHook({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}, config: Partial<RequestConfig> = {}) {
    const queryKey = getPetByIdQueryKey({ pet_id });
    return queryOptions({
        enabled: !!(pet_id),
        queryKey,
        queryFn: async ({ signal }) => {
            config.signal = signal;
            return getPetByIdHook({ pet_id }, config);
        },
    });
}

 /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:pet_id}
 */
export function useGetPetByIdHook<TData = GetPetByIdQueryResponse, TQueryData = GetPetByIdQueryResponse, TQueryKey extends QueryKey = GetPetByIdQueryKey>({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}, options: {
    query?: Partial<QueryObserverOptions<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey({ pet_id });
    const query = useQuery({
        ...getPetByIdQueryOptionsHook({ pet_id }, config) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, GetPetById400 | GetPetById404> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}