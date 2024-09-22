import client from "@kubb/plugin-client/client";
import type { RequestConfig, ResponseConfig } from "@kubb/plugin-client/client";
import type { QueryKey, QueryObserverOptions, UseQueryResult } from "@tanstack/react-query";
import { useQuery, queryOptions } from "@tanstack/react-query";

 export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: "/pet/findByTags" }, ...(params ? [params] : [])] as const;

 export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>;

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: "GET", url: `/pet/findByTags`, params, headers: { ...headers, ...config.headers }, ...config });
    return { ...res, data: findPetsByTagsQueryResponse.parse(res.data) };
}

 export function findPetsByTagsQueryOptions(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const queryKey = findPetsByTagsQueryKey(params);
    return queryOptions({
        queryKey,
        queryFn: async () => {
            return findPetsByTags(headers, params, config);
        },
    });
}

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags<TData = ResponseConfig<FindPetsByTagsQueryResponse>, TQueryData = ResponseConfig<FindPetsByTagsQueryResponse>, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, options: {
    query?: Partial<QueryObserverOptions<ResponseConfig<FindPetsByTagsQueryResponse>, FindPetsByTags400, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params);
    const query = useQuery({
        ...findPetsByTagsQueryOptions(headers, params, config) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, FindPetsByTags400> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
