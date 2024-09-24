import client from "axios";
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from "@tanstack/react-query";
import type { RequestConfig } from "axios";
import type { MaybeRef } from "vue";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { unref } from "vue";

 export const findPetsByTagsQueryKey = (params?: MaybeRef<FindPetsByTagsQueryParams>) => [{ url: "/pet/findByTags" }, ...(params ? [params] : [])] as const;

 export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>;

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: "GET", url: `/pet/findByTags`, params, headers: { ...headers, ...config.headers }, ...config });
    return findPetsByTagsQueryResponse.parse(res.data);
}

 export function findPetsByTagsQueryOptions(headers: MaybeRef<FindPetsByTagsQueryParams>, params?: MaybeRef<FindPetsByTagsQueryParams>, config: Partial<RequestConfig> = {}) {
    const queryKey = findPetsByTagsQueryKey(params);
    return queryOptions({
        queryKey,
        queryFn: async () => {
            return findPetsByTags(unref(headers), unref(params), unref(config));
        },
    });
}

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags<TData = FindPetsByTagsQueryResponse, TQueryData = FindPetsByTagsQueryResponse, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(headers: MaybeRef<FindPetsByTagsHeaderParams>, params?: MaybeRef<FindPetsByTagsQueryParams>, options: {
    query?: Partial<QueryObserverOptions<FindPetsByTagsQueryResponse, FindPetsByTags400, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params);
    const query = useQuery({
        ...findPetsByTagsQueryOptions(headers, params, config) as unknown as QueryObserverOptions,
        queryKey: queryKey as QueryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryReturnType<TData, FindPetsByTags400> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
