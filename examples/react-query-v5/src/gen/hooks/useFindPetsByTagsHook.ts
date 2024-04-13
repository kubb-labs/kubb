import client from "@kubb/swagger-client/client";
import { useQuery, queryOptions, useInfiniteQuery, infiniteQueryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTags400 } from "../models/FindPetsByTags";
import type { QueryObserverOptions, UseQueryResult, QueryKey, InfiniteQueryObserverOptions, UseInfiniteQueryResult, InfiniteData, UseSuspenseQueryOptions, UseSuspenseQueryResult } from "@tanstack/react-query";

 type FindPetsByTagsClient = typeof client<FindPetsByTagsQueryResponse, FindPetsByTags400, never>;
type FindPetsByTags = {
    data: FindPetsByTagsQueryResponse;
    error: FindPetsByTags400;
    request: never;
    pathParams: never;
    queryParams: FindPetsByTagsQueryParams;
    headerParams: never;
    response: Awaited<ReturnType<FindPetsByTagsClient>>;
    client: {
        parameters: Partial<Parameters<FindPetsByTagsClient>[0]>;
        return: Awaited<ReturnType<FindPetsByTagsClient>>;
    };
};
export const findPetsByTagsQueryKey = (params?: FindPetsByTags["queryParams"]) => ["/pet/findByTags", ...(params ? [params] : [])] as const;
export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>;
export function findPetsByTagsQueryOptions(params?: FindPetsByTags["queryParams"], options: FindPetsByTags["client"]["parameters"] = {}) {
    const queryKey = findPetsByTagsQueryKey(params);
    return queryOptions({
        queryKey,
        queryFn: async () => {
            const res = await client<FindPetsByTags["data"], FindPetsByTags["error"]>({
                method: "get",
                url: `/pet/findByTags`,
                params,
                ...options
            });
            return res;
        },
    });
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsHook<TData = FindPetsByTags["response"], TQueryData = FindPetsByTags["response"], TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(params?: FindPetsByTags["queryParams"], options: {
    query?: Partial<QueryObserverOptions<FindPetsByTags["response"], FindPetsByTags["error"], TData, TQueryData, TQueryKey>>;
    client?: FindPetsByTags["client"]["parameters"];
} = {}): UseQueryResult<TData, FindPetsByTags["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params);
    const query = useQuery({
        ...findPetsByTagsQueryOptions(params, clientOptions) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, FindPetsByTags["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
export const findPetsByTagsInfiniteQueryKey = (params?: FindPetsByTags["queryParams"]) => ["/pet/findByTags", ...(params ? [params] : [])] as const;
export type FindPetsByTagsInfiniteQueryKey = ReturnType<typeof findPetsByTagsInfiniteQueryKey>;
export function findPetsByTagsInfiniteQueryOptions(params?: FindPetsByTags["queryParams"], options: FindPetsByTags["client"]["parameters"] = {}) {
    const queryKey = findPetsByTagsInfiniteQueryKey(params);
    return infiniteQueryOptions({
        queryKey,
        queryFn: async ({ pageParam }) => {
            const res = await client<FindPetsByTags["data"], FindPetsByTags["error"]>({
                method: "get",
                url: `/pet/findByTags`,
                ...options,
                params: {
                    ...params,
                    ["pageSize"]: pageParam,
                    ...(options.params || {}),
                }
            });
            return res;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1,
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1
    });
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsHookInfinite<TData = InfiniteData<FindPetsByTags["response"]>, TQueryData = FindPetsByTags["response"], TQueryKey extends QueryKey = FindPetsByTagsInfiniteQueryKey>(params?: FindPetsByTags["queryParams"], options: {
    query?: Partial<InfiniteQueryObserverOptions<FindPetsByTags["response"], FindPetsByTags["error"], TData, TQueryData, TQueryKey>>;
    client?: FindPetsByTags["client"]["parameters"];
} = {}): UseInfiniteQueryResult<TData, FindPetsByTags["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsInfiniteQueryKey(params);
    const query = useInfiniteQuery({
        ...findPetsByTagsInfiniteQueryOptions(params, clientOptions) as unknown as InfiniteQueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<InfiniteQueryObserverOptions, "queryKey">
    }) as UseInfiniteQueryResult<TData, FindPetsByTags["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
export const findPetsByTagsSuspenseQueryKey = (params?: FindPetsByTags["queryParams"]) => ["/pet/findByTags", ...(params ? [params] : [])] as const;
export type FindPetsByTagsSuspenseQueryKey = ReturnType<typeof findPetsByTagsSuspenseQueryKey>;
export function findPetsByTagsSuspenseQueryOptions(params?: FindPetsByTags["queryParams"], options: FindPetsByTags["client"]["parameters"] = {}) {
    const queryKey = findPetsByTagsSuspenseQueryKey(params);
    return queryOptions({
        queryKey,
        queryFn: async () => {
            const res = await client<FindPetsByTags["data"], FindPetsByTags["error"]>({
                method: "get",
                url: `/pet/findByTags`,
                params,
                ...options
            });
            return res;
        },
    });
}
/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTagsHookSuspense<TData = FindPetsByTags["response"], TQueryKey extends QueryKey = FindPetsByTagsSuspenseQueryKey>(params?: FindPetsByTags["queryParams"], options: {
    query?: Partial<UseSuspenseQueryOptions<FindPetsByTags["response"], FindPetsByTags["error"], TData, TQueryKey>>;
    client?: FindPetsByTags["client"]["parameters"];
} = {}): UseSuspenseQueryResult<TData, FindPetsByTags["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsSuspenseQueryKey(params);
    const query = useSuspenseQuery({
        ...findPetsByTagsSuspenseQueryOptions(params, clientOptions) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseSuspenseQueryResult<TData, FindPetsByTags["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}