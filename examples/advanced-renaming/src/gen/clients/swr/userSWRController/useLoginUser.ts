import useSWR from "swr";
import client from "../../../../swr-client.ts";
import type { SWRConfiguration, SWRResponse } from "swr";
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from "../../../models/ts/userController/LoginUser";

type LoginUserClient = typeof client<LoginUserQueryResponse, LoginUser400, never>;
type LoginUser = {
    data: LoginUserQueryResponse;
    error: LoginUser400;
    request: never;
    pathParams: never;
    queryParams: LoginUserQueryParams;
    headerParams: never;
    response: Awaited<ReturnType<LoginUserClient>>;
    client: {
        parameters: Partial<Parameters<LoginUserClient>[0]>;
        return: Awaited<ReturnType<LoginUserClient>>;
    };
};
export function loginUserQueryOptions<TData extends LoginUser["response"] = LoginUser["response"], TError = LoginUser["error"]>(params?: LoginUser["queryParams"], options: LoginUser["client"]["parameters"] = {}): SWRConfiguration<TData, TError> {
    return {
        fetcher: async () => {
            const res = await client<TData, TError>({
                method: "get",
                url: `/user/login`,
                params,
                ...options
            });
            return res;
        },
    };
}
/**
     * @summary Logs user into the system
     * @link /user/login */
export function useLoginUser<TData extends LoginUser["response"] = LoginUser["response"], TError = LoginUser["error"]>(params?: LoginUser["queryParams"], options?: {
    query?: SWRConfiguration<TData, TError>;
    client?: LoginUser["client"]["parameters"];
    shouldFetch?: boolean;
}): SWRResponse<TData, TError> {
    const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {};
    const url = `/user/login` as const;
    const query = useSWR<TData, TError, [
        typeof url,
        typeof params
    ] | null>(shouldFetch ? [url, params] : null, {
        ...loginUserQueryOptions<TData, TError>(params, clientOptions),
        ...queryOptions
    });
    return query;
}