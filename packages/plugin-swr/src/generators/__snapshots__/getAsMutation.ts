import client from "@kubb/plugin-client/client";
import useSWRMutation from "custom-swr/mutation";
import type { RequestConfig } from "@kubb/plugin-client/client";

 export const findPetsByTagsMutationKey = () => [{ "url": "/pet/findByTags" }] as const;

 export type FindPetsByTagsMutationKey = ReturnType<typeof findPetsByTagsMutationKey>;

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
async function findPetsByTags(params?: FindPetsByTagsQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<FindPetsByTagsQueryResponse, FindPetsByTags400, unknown>({ method: "GET", url: `/pet/findByTags`, params, ...config });
    return res.data;
}

 /**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function useFindPetsByTags(params?: FindPetsByTagsQueryParams, options: {
    mutation?: Parameters<typeof useSWRMutation<FindPetsByTagsQueryResponse, FindPetsByTags400, FindPetsByTagsMutationKey>>[2];
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const mutationKey = findPetsByTagsMutationKey();
    return useSWRMutation<FindPetsByTagsQueryResponse, FindPetsByTags400, FindPetsByTagsMutationKey | null>(shouldFetch ? mutationKey : null, async (_url) => {
        return findPetsByTags(params, config);
    }, mutationOptions);
}
