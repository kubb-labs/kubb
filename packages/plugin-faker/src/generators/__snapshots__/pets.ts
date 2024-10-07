import { faker } from "@faker-js/faker";

 export function pets() {
    return faker.helpers.multiple(() => (pet())) as any;
}
