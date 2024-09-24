import client from "axios";
import type { MutationObserverOptions, UseMutationResult, MutationKey } from "@tanstack/react-query";
import type { RequestConfig } from "axios";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/react-query";

 export const updatePetWithFormMutationKey = () => [{ "url": "/pet/{petId}" }] as const;

 export type UpdatePetWithFormMutationKey = ReturnType<typeof updatePetWithFormMutationKey>;

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams["petId"], data?: UpdatePetWithFormMutationRequest, params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> = {}) {
    const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>({ method: "POST", url: `/pet/${petId}`, params, data, ...config });
    return updatePetWithFormMutationResponse.parse(res.data);
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm(options: {
    mutation?: MutationObserverOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, {
        petId: MaybeRef<UpdatePetWithFormPathParams["petId"]>;
        data?: MaybeRef<UpdatePetWithFormMutationRequest>;
        params?: MaybeRef<UpdatePetWithFormQueryParams>;
    }>;
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    const mutationKey = mutationOptions?.mutationKey ?? updatePetWithFormMutationKey();
    const mutation = useMutation({
        mutationFn: async ({ petId, data, params }: {
            petId: UpdatePetWithFormPathParams["petId"];
            data?: UpdatePetWithFormMutationRequest;
            params?: UpdatePetWithFormQueryParams;
        }) => {
            return updatePetWithForm(petId, data, params, config);
        },
        ...mutationOptions
    }) as UseMutationResult<UpdatePetWithFormMutationResponse, UpdatePetWithForm405> & {
        mutationKey: MutationKey;
    };
    mutation.mutationKey = mutationKey as MutationKey;
    return mutation;
}
