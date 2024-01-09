import client from "../../../../axios-client.ts";
import type { ResponseConfig } from "../../../../axios-client.ts";
import type { FindPetsByTagsQueryResponse, FindPetsByTagsQueryParams, FindPetsByTagsHeaderParams } from "../../../models/ts/petController/FindPetsByTags";

/**
     * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
     * @summary Finds Pets by tags
     * @link /pet/findByTags */
export async function findPetsByTags(headers: FindPetsByTagsHeaderParams, params?: FindPetsByTagsQueryParams, options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<FindPetsByTagsQueryResponse>> {
    const res = await client<FindPetsByTagsQueryResponse>({
        method: "get",
        url: `/pet/findByTags`,
        params,
        headers: { ...headers, ...options.headers },
        ...options
    });
    return res;
}