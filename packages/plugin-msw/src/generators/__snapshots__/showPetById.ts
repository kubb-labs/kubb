import { http } from "msw";

 export function showPetById(data?: ShowPetByIdQueryResponse) {
    return http.get("*/pets/:petId", function handler(info) {
        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    });
}
