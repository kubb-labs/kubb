import client from "@kubb/plugin-client/client";
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from "../models/UploadFile.ts";
import type { RequestConfig } from "@kubb/plugin-client/client";
import type { MutationObserverOptions, MutationKey } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/vue-query";

 export const uploadFileMutationKey = () => [{ "url": "/pet/{petId}/uploadImage" }] as const;

 export type UploadFileMutationKey = ReturnType<typeof uploadFileMutationKey>;

 /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
async function uploadFile(petId: UploadFilePathParams["petId"], data?: UploadFileMutationRequest, params?: UploadFileQueryParams, config: Partial<RequestConfig<UploadFileMutationRequest>> = {}) {
    const res = await client<UploadFileMutationResponse, Error, UploadFileMutationRequest>({ method: "POST", url: `/pet/${petId}/uploadImage`, baseURL: "https://petstore3.swagger.io/api/v3", params, data, headers: { "Content-Type": "application/octet-stream", ...config.headers }, ...config });
    return res.data;
}

 /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile(options: {
    mutation?: MutationObserverOptions<UploadFileMutationResponse, Error, {
        petId: MaybeRef<UploadFilePathParams["petId"]>;
        data?: MaybeRef<UploadFileMutationRequest>;
        params?: MaybeRef<UploadFileQueryParams>;
    }>;
    client?: Partial<RequestConfig<UploadFileMutationRequest>>;
} = {}) {
    const { mutation: mutationOptions, client: config = {} } = options ?? {};
    const mutationKey = mutationOptions?.mutationKey ?? uploadFileMutationKey();
    return useMutation<UploadFileMutationResponse, Error, {
        petId: UploadFilePathParams["petId"];
        data?: UploadFileMutationRequest;
        params?: UploadFileQueryParams;
    }>({
        mutationFn: async ({ petId, data, params }) => {
            return uploadFile(petId, data, params, config);
        },
        mutationKey,
        ...mutationOptions
    });
}