import client from "@kubb/plugin-client/client";
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from "../../models/GetPetById";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from "@tanstack/react-query";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

 export const getPetByIdSuspenseQueryKey = ({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}) => ["v5", { url: "/pet/:pet_id", params: { pet_id: pet_id } }] as const;

 export type GetPetByIdSuspenseQueryKey = ReturnType<typeof getPetByIdSuspenseQueryKey>;

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

 export function getPetByIdSuspenseQueryOptionsHook({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}, config: Partial<RequestConfig> = {}) {
    const queryKey = getPetByIdSuspenseQueryKey({ pet_id });
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
export function useGetPetByIdSuspenseHook<TData = GetPetByIdQueryResponse, TQueryData = GetPetByIdQueryResponse, TQueryKey extends QueryKey = GetPetByIdSuspenseQueryKey>({ pet_id }: {
    pet_id: GetPetByIdPathParams["pet_id"];
}, options: {
    query?: Partial<UseSuspenseQueryOptions<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, TData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdSuspenseQueryKey({ pet_id });
    const query = useSuspenseQuery({
        ...getPetByIdSuspenseQueryOptionsHook({ pet_id }, config) as unknown as UseSuspenseQueryOptions,
        queryKey,
        ...queryOptions as unknown as Omit<UseSuspenseQueryOptions, "queryKey">
    }) as UseSuspenseQueryResult<TData, GetPetById400 | GetPetById404> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}