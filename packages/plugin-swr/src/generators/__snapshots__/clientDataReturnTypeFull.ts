import client from "@kubb/plugin-client/client";
import useSWR from "swr";
import type { RequestConfig, ResponseConfig } from "@kubb/plugin-client/client";

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: "GET", url: `/pet/findByTags`, params, ...config });
    return res;
}

 export function findPetsByTagsQueryOptions(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    return {
        fetcher: async () => {
            return findPetsByTags(params, config);
        },
    };
}

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags(params?: FindPetsByTagsQueryParams, options: {
    query?: Parameters<typeof useSWR<ResponseConfig<FindPetsByTagsQueryResponse>, FindPetsByTags400, any>>[2];
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const swrKey = [`/pet/findByTags`, params] as const;
    return useSWR<ResponseConfig<FindPetsByTagsQueryResponse>, FindPetsByTags400, typeof swrKey | null>(shouldFetch ? swrKey : null, {
        ...findPetsByTagsQueryOptions(params, config),
        ...queryOptions
    });
}
