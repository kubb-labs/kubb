import client from "@kubb/plugin-client/client";
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

 type UploadFileClient = typeof client<UploadFileMutationResponse, UploadFile400, FormData>;

 /**
 * @description Upload file
 * @link /upload
 */
export function UploadFile<TData = UploadFile["response"], TQueryData = UploadFile["response"], TQueryKey extends QueryKey = UploadFileQueryKey>(data: UploadFile["request"], options: {
    query?: Partial<UseBaseQueryOptions<UploadFile["response"], UploadFile["error"], TData, TQueryData, TQueryKey>>;
    client?: UploadFile["client"]["parameters"];
} = {}): UseQueryResult<TData, UploadFile["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? UploadFileQueryKey(data);
    const query = useQuery<UploadFile["data"], UploadFile["error"], TData, any>({
        ...UploadFileQueryOptions<TData, TQueryData>(data, clientOptions),
        queryKey,
        ...queryOptions
    }) as UseQueryResult<TData, UploadFile["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}

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
