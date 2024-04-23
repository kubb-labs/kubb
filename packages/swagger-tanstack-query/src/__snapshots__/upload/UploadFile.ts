import client from "@kubb/swagger-client/client";
import { useQuery } from "@tanstack/react-query";
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFile400 } from "./";
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired } from "@tanstack/react-query";

 type UploadFileClient = typeof client<UploadFileMutationResponse, UploadFile400, UploadFileMutationRequest>;
type UploadFile = {
    data: UploadFileMutationResponse;
    error: UploadFile400;
    request: UploadFileMutationRequest;
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
            const res = await client<UploadFile["data"], UploadFile["error"]>({
                method: "post",
                url: `/upload`,
                data,
                headers: { "Content-Type": "multipart/form-data", ...options.headers },
                ...options
            });
            return res.data;
        },
    };
}
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
