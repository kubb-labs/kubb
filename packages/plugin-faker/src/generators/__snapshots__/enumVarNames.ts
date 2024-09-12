import { faker } from "@faker-js/faker";

 export function enumVarNamesType() {
    return faker.helpers.arrayElement<any>(["Pending", "Received"]);
}
