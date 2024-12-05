import { http } from "msw";

 export function createPets(data?: CreatePetsMutationResponse | ((info: Parameters<Parameters<typeof http.post>[1]>[0]) => Response)) {
    return http.post("*/pets", function handler(info) {
        if (typeof data === "function")
            return data(info);
        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    });
}
