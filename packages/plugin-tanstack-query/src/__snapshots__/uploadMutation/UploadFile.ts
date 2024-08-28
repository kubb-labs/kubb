import client from "@kubb/plugin-client/client";
import { queryOptions } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

 type UploadFileClient = typeof client<UploadFileMutationResponse, UploadFile400, FormData>;

 type UploadFile = {
    data: UploadFileMutationResponse;
    error: UploadFile400;
    request: FormData;
    pathParams: never;
    queryParams: never;
    headerParams: never;
    response: UploadFileMutationResponse;
    client: {
        parameters: Partial<Parameters<UploadFileClient>[0]>;
        return: Awaited<ReturnType<UploadFileClient>>;
    };
};

 export type UploadFileQueryKey = ReturnType<typeof UploadFileQueryKey>;

 export function UploadFileQueryOptions(data: UploadFile["request"], options: UploadFile["client"]["parameters"] = {}) {
    const queryKey = UploadFileQueryKey(data);
    return queryOptions({
        queryKey,
        queryFn: async () => {
            const formData = new FormData();
            if (data) {
                Object.keys(data).forEach((key) => {
                    const value = data[key];
                    if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
                        formData.append(key, value);
                    }
                });
            }
            const res = await client<UploadFile["data"], UploadFile["error"]>({
                method: "post",
                url: `/upload`,
                data: formData,
                headers: { "Content-Type": "multipart/form-data", ...options.headers },
                ...options
            });
            return res.data;
        },
    });
}
