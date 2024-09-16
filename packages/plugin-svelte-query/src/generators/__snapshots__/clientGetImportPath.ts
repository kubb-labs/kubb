import client from "axios";
import type { QueryKey, CreateBaseQueryOptions, CreateQueryResult } from "@tanstack/svelte-query";
import type { RequestConfig } from "axios";
import { createQuery, queryOptions } from "@tanstack/svelte-query";

 export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [{ url: "/pet/findByTags" }, ...(params ? [params] : [])] as const;

 export type FindPetsByTagsQueryKey = ReturnType<typeof findPetsByTagsQueryKey>;

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: "get", url: `/pet/findByTags`, params, headers: { ...headers, ...config.headers }, ...config });
    return findPetsByTagsQueryResponse.parse(res.data);
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
export function findPetsByTagsQuery<TData = FindPetsByTagsQueryResponse, TQueryData = FindPetsByTagsQueryResponse, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, options: {
    query?: Partial<CreateBaseQueryOptions<FindPetsByTagsQueryResponse, FindPetsByTags400, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params);
    const query = createQuery({
        ...findPetsByTagsQueryOptions(headers, params, config) as unknown as CreateBaseQueryOptions,
        queryKey,
        ...queryOptions as unknown as Omit<CreateBaseQueryOptions, "queryKey">
    }) as CreateQueryResult<TData, FindPetsByTags400> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
