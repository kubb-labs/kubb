import client from "@kubb/plugin-client/client";
import type { QueryObserverOptions, UseQueryResult, QueryKey } from "@tanstack/react-query";
import { useQuery, queryOptions } from "@tanstack/react-query";

 type UploadFileClient = typeof client<UploadFileMutationResponse, UploadFile400, FormData>;

 /**
 * @description Upload file
 * @link /upload
 */
export function UploadFile<TData = UploadFile["response"], TQueryData = UploadFile["response"], TQueryKey extends QueryKey = UploadFileQueryKey>(data: UploadFile["request"], options: {
    query?: Partial<QueryObserverOptions<UploadFile["response"], UploadFile["error"], TData, TQueryData, TQueryKey>>;
    client?: UploadFile["client"]["parameters"];
} = {}): UseQueryResult<TData, UploadFile["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? UploadFileQueryKey(data);
    const query = useQuery({
        ...UploadFileQueryOptions(data, clientOptions) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, UploadFile["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}

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
