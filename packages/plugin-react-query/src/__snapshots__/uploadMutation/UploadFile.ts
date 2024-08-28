import client from "@kubb/plugin-client/client";
import type { UseBaseQueryOptions, QueryKey, WithRequired } from "@tanstack/react-query";

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

 export const UploadFileQueryKey = (data: UploadFile["request"]) => [{ url: "/upload" }, ...(data ? [data] : [])] as const;

 export type UploadFileQueryKey = ReturnType<typeof UploadFileQueryKey>;

 export function UploadFileQueryOptions<TData = UploadFile["response"], TQueryData = UploadFile["response"]>(data: UploadFile["request"], options: UploadFile["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<UploadFile["response"], UploadFile["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = UploadFileQueryKey(data);
    return {
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
    };
}
