import client from "@kubb/plugin-client/client";
import useSWRMutation from "custom-swr/mutation";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { SWRMutationConfiguration } from "custom-swr/mutation";
import type { Key } from "swr";

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
    mutation?: SWRMutationConfiguration<FindPetsByTagsQueryResponse, FindPetsByTags400>;
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const swrKey = [`/pet/findByTags`, params] as const;
    return useSWRMutation<FindPetsByTagsQueryResponse, FindPetsByTags400, Key>(shouldFetch ? swrKey : null, async (_url) => {
        return findPetsByTags(params, config);
    }, mutationOptions);
}
