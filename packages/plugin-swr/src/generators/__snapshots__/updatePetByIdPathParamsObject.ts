import client from "@kubb/plugin-client/client";
import useSWRMutation from "swr/mutation";
import type { RequestConfig } from "@kubb/plugin-client/client";

 export const updatePetWithFormMutationKey = () => [{ "url": "/pet/{petId}" }] as const;

 export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({ method: "POST", url: `/pet/${petId}`, params, ...config });
    return res.data;
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithFormQueryParams, options: {
    mutation?: Parameters<typeof useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationKey>>[2];
    client?: Partial<RequestConfig>;
    shouldFetch?: boolean;
} = {}) {
    const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {};
    const mutationKey = updatePetWithFormMutationKey();
    return useSWRMutation<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationKey | null>(shouldFetch ? mutationKey : null, async (_url) => {
        return updatePetWithForm({ petId }, params, config);
    }, mutationOptions);
}
