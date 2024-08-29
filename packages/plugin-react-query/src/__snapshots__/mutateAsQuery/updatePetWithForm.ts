import client from "@kubb/plugin-client/client";
import type { UseBaseQueryOptions, UseQueryResult, QueryKey, WithRequired } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

 type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, UpdatePetWithFormMutationRequest>;

 type UpdatePetWithForm = {
    data: UpdatePetWithFormMutationResponse;
    error: UpdatePetWithForm405;
    request: UpdatePetWithFormMutationRequest;
    pathParams: UpdatePetWithFormPathParams;
    queryParams: UpdatePetWithFormQueryParams;
    headerParams: never;
    response: UpdatePetWithFormMutationResponse;
    client: {
        parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>;
        return: Awaited<ReturnType<UpdatePetWithFormClient>>;
    };
};

 export const updatePetWithFormQueryKey = ({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithForm["queryParams"], data?: UpdatePetWithForm["request"]) => [{ url: "/pet/:petId", params: { petId: petId } }, ...(params ? [params] : []), ...(data ? [data] : [])] as const;

 export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>;

 export function updatePetWithFormQueryOptions<TData = UpdatePetWithForm["response"], TQueryData = UpdatePetWithForm["response"]>({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithForm["queryParams"], data?: UpdatePetWithForm["request"], options: UpdatePetWithForm["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<UpdatePetWithForm["response"], UpdatePetWithForm["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = updatePetWithFormQueryKey({ petId }, params, data);
    return {
        queryKey,
        queryFn: async () => {
            const res = await client<UpdatePetWithForm["data"], UpdatePetWithForm["error"]>({
                method: "post",
                url: `/pet/${petId}`,
                params,
                data,
                ...options
            });
            return res.data;
        },
    };
}

 /**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function updatePetWithForm<TData = UpdatePetWithForm["response"], TQueryData = UpdatePetWithForm["response"], TQueryKey extends QueryKey = UpdatePetWithFormQueryKey>({ petId }: {
    petId: UpdatePetWithFormPathParams["petId"];
}, params?: UpdatePetWithForm["queryParams"], data?: UpdatePetWithForm["request"], options: {
    query?: Partial<UseBaseQueryOptions<UpdatePetWithForm["response"], UpdatePetWithForm["error"], TData, TQueryData, TQueryKey>>;
    client?: UpdatePetWithForm["client"]["parameters"];
} = {}): UseQueryResult<TData, UpdatePetWithForm["error"]> & {
    queryKey: TQueryKey;
} {
    const { query: queryOptions, client: clientOptions = {} } = options ?? {};
    const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey({ petId }, params, data);
    const query = useQuery<UpdatePetWithForm["data"], UpdatePetWithForm["error"], TData, any>({
        ...updatePetWithFormQueryOptions<TData, TQueryData>({ petId }, params, data, clientOptions),
        queryKey,
        ...queryOptions
    }) as UseQueryResult<TData, UpdatePetWithForm["error"]> & {
        queryKey: TQueryKey;
    };
    query.queryKey = queryKey as TQueryKey;
    return query;
}
