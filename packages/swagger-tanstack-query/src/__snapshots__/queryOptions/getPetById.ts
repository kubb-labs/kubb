import client from "@kubb/swagger-client/client";
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from "./";
import type { UseBaseQueryOptions, QueryKey, WithRequired } from "@tanstack/react-query";

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
export const GetPetByIdQueryKey = ({ petId }: GetPetByIdPathParams) => [{ url: "/pet/:petId", params: { petId: petId } }] as const;
export type GetPetByIdQueryKey = ReturnType<typeof GetPetByIdQueryKey>;
export function GetPetByIdQueryOptions<TData = GetPetById["response"], TQueryData = GetPetById["response"]>({ petId }: GetPetByIdPathParams, options: GetPetById["client"]["parameters"] = {}): WithRequired<UseBaseQueryOptions<GetPetById["response"], GetPetById["error"], TData, TQueryData>, "queryKey"> {
    const queryKey = GetPetByIdQueryKey(petId);
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
