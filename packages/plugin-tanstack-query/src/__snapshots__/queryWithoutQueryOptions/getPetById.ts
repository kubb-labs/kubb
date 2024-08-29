import client from "@kubb/plugin-client/client";
import type { QueryObserverOptions, UseQueryResult, QueryKey } from "@tanstack/react-query";
import { useQuery, queryOptions } from "@tanstack/react-query";

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

 export const getPetByIdQueryKey = ({ petId }: {
    petId: GetPetByIdPathParams["petId"];
}) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;

 export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>;

 /**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetById<TData = GetPetById["response"], TQueryData = GetPetById["response"], TQueryKey extends QueryKey = GetPetByIdQueryKey>({ petId }: {
    petId: GetPetByIdPathParams["petId"];
}, options: {
    query?: Partial<QueryObserverOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData, TQueryKey>>;
    client?: GetPetById["client"]["parameters"];
} = {}): UseQueryResult<TData, GetPetById["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey({ petId });
    const query = useQuery({
        ...getPetByIdQueryOptions({ petId }, clientOptions) as unknown as QueryObserverOptions,
        queryKey,
        ...queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">
    }) as UseQueryResult<TData, GetPetById["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
