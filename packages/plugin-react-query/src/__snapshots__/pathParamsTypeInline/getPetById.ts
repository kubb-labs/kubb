import client from "@kubb/plugin-client/client";
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

 type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>;

 type GetPetById = {
    data: GetPetByIdQueryResponse;
    error: GetPetById400 | GetPetById404;
    request: never;
    pathParams: GetPetByIdPathParams;
    queryParams: never;
    headerParams: never;
    response: GetPetByIdQueryResponse;
    client: {
        parameters: Partial<Parameters<GetPetByIdClient>[0]>;
        return: Awaited<ReturnType<GetPetByIdClient>>;
    };
};

 export const getPetByIdQueryKey = (petId: GetPetByIdPathParams["petId"]) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;

 export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>;

 export function getPetByIdQueryOptions<TData = GetPetById["response"], TQueryData = GetPetById["response"]>(petId: GetPetByIdPathParams["petId"], options: GetPetById["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = getPetByIdQueryKey(petId);
    return {
        queryKey,
        queryFn: async () => {
            const res = await client<GetPetById["data"], GetPetById["error"]>({
                method: "get",
                url: `/pet/${petId}`,
                ...options
            });
            return res.data;
        },
    };
}

 /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetById<TData = GetPetById["response"], TQueryData = GetPetById["response"], TQueryKey extends QueryKey = GetPetByIdQueryKey>(petId: GetPetByIdPathParams["petId"], options: {
    query?: Partial<UseBaseQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData, TQueryKey>>;
    client?: GetPetById["client"]["parameters"];
} = {}): UseQueryResult<TData, GetPetById["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId);
    const query = useQuery<GetPetById["data"], GetPetById["error"], TData, any>({
        ...getPetByIdQueryOptions<TData, TQueryData>(petId, clientOptions),
        queryKey,
        ...queryOptions
    }) as UseQueryResult<TData, GetPetById["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
