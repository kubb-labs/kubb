import client from "@kubb/plugin-client/client";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>({ method: "post", url: `/pet/${petId}`, params, data, ...config });
    return updatePetWithFormMutationResponse.parse(res.data);
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(options: {
    mutation?: UseMutationOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, {
        petId: MaybeRef<UpdatePetWithFormPathParams["petId"]>;
        data?: MaybeRef<UpdatePetWithFormMutationRequest>;
        params?: MaybeRef<UpdatePetWithFormQueryParams>;
    }>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    return useMutation({
        mutationFn: async ({ petId, data, params }: {
            petId: UpdatePetWithFormPathParams["petId"];
            data?: UpdatePetWithFormMutationRequest;
            params?: UpdatePetWithFormQueryParams;
        }) => {
            return updatePetWithForm({ petId }, data, params, config);
        },
        ...mutationOptions
    });
}
