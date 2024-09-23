import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { QueryKey, CreateBaseQueryOptions } from "@tanstack/react-query";
import { createQuery, queryOptions } from "@tanstack/react-query";

 export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => [test, { url: "/pet/findByTags" }, ...(params ? [params] : [])] as const;

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
export function createFindPetsByTags<TData = FindPetsByTagsQueryResponse, TQueryData = FindPetsByTagsQueryResponse, TQueryKey extends QueryKey = FindPetsByTagsQueryKey>(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, options: {
    query?: Partial<CreateBaseQueryOptions<FindPetsByTagsQueryResponse, FindPetsByTags400, TData, TQueryData, TQueryKey>>;
    client?: Partial<RequestConfig>;
} = {}) {
    const { query: queryOptions, client: config = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params);
    const query = createQuery(() => ({
        ...findPetsByTagsQueryOptions(headers, params, config) as unknown as CreateBaseQueryOptions,
        queryKey,
        initialData: null,
        ...queryOptions as unknown as Omit<CreateBaseQueryOptions, "queryKey">
    })) as ReturnType<typeof query> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
