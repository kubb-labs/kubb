import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, InfiniteQueryObserverOptions, UseInfiniteQueryReturnType } from "@tanstack/react-query";
import type { MaybeRef } from "vue";
import { useInfiniteQuery, infiniteQueryOptions } from "@tanstack/react-query";

 export const findPetsByTagsInfiniteQueryKey = (params?: MaybeRef<FindPetsByTagsQueryParams>) => [{ url: "/pet/findByTags" }, ...(params ? [params] : [])] as const;

 export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>;

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: "GET", url: `/pet/findByTags`, params, headers: { ...headers, ...config.headers }, ...config });
    return findPetsByTagsQueryResponse.parse(res.data);
}

 export function findPetsByTagsInfiniteQueryOptions(headers: MaybeRef<FindPetsByTagsHeaderParams>, params?: MaybeRef<FindPetsByTagsQueryParams>, config: Partial<RequestConfig> = {}) {
    const queryKey = findPetsByTagsInfiniteQueryKey(params);
    return infiniteQueryOptions({
        queryKey,
        queryFn: async ({ pageParam }) => {
            if (params) {
                params["pageSize"] = pageParam as unknown as FindPetsByTagsQueryParams["pageSize"];
            }
            return findPetsByTags(headers, params, config);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage["cursor"],
        getPreviousPageParam: (firstPage) => firstPage["cursor"]
    });
}

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsInfinite<TData = FindPetsByTagsQueryResponse, TQueryData = FindPetsByTagsQueryResponse, TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey>(headers: MaybeRef<FindPetsByTagsHeaderParams>, params?: MaybeRef<FindPetsByTagsQueryParams>, options: {
    query?: Partial<InfiniteQueryObserverOptions<FindPetsByTagsQueryResponse, FindPetsByTags400, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params);
    const query = useInfiniteQuery({
        ...findPetsByTagsInfiniteQueryOptions(headers, params, config) as unknown as InfiniteQueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<InfiniteQueryObserverOptions, "queryKey">
    }) as UseInfiniteQueryReturnType<TData, FindPetsByTags400> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}