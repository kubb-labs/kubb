import client from "@kubb/plugin-client/client";
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from "../models/UploadFile.ts";
import type { UseMutationOptions } from "@tanstack/vue-query";
import type { MaybeRef } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { unref } from "vue";

 type UploadFileClient = typeof client<UploadFileMutationResponse, never, UploadFileMutationRequest>;

 type UploadFile = {
    data: UploadFileMutationResponse;
    error: never;
    request: UploadFileMutationRequest;
    pathParams: UploadFilePathParams;
    queryParams: UploadFileQueryParams;
    headerParams: never;
    response: UploadFileMutationResponse;
    client: {
        parameters: Partial<Parameters<UploadFileClient>[0]>;
        return: Awaited<ReturnType<UploadFileClient>>;
    };
};

 /**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile(refPetId: MaybeRef<UploadFilePathParams["petId"]>, refParams?: MaybeRef<UploadFileQueryParams>, options: {
    mutation?: UseMutationOptions<UploadFile["response"], UploadFile["error"], UploadFile["request"], unknown>;
    client?: UploadFile["client"]["parameters"];
} = {}) {
    const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {};
    return useMutation({
        mutationFn: async (data) => {
            const petId = unref(refPetId);
            const params = unref(refParams);
            const res = await client<UploadFile["data"], UploadFile["error"], UploadFile["request"]>({
                method: "post",
                url: `/pet/${petId}/uploadImage`,
                params,
                data,
                headers: { "Content-Type": "application/octet-stream", ...clientOptions.headers },
                ...clientOptions
            });
            return res.data;
        },
        ...mutationOptions
    });
}