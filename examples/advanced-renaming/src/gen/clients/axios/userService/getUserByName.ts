import client from "../../../../axios-client.ts";
import type { ResponseConfig } from "../../../../axios-client.ts";
import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from "../../../models/ts/userController/GetUserByName";

/**
     * @summary Get user by user name
     * @link /user/:username */
export async function getUserByName({ username }: GetUserByNamePathParams, options: Partial<Parameters<typeof client>[0]> = {}): Promise<ResponseConfig<GetUserByNameQueryResponse>> {
    const res = await client<GetUserByNameQueryResponse>({
        method: "get",
        url: `/user/${username}`,
        ...options
    });
    return res;
}