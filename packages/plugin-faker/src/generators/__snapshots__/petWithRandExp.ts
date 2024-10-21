import RandExp from "randexp";
import { faker } from "@faker-js/faker";

 export function pet(data?: Partial<Pet>) {
    return {
        ...{ "id": faker.number.int(), "name": faker.string.alpha(), "tag": faker.string.alpha(), "code": faker.helpers.arrayElement<any>([faker.string.alpha(), new RandExp("\\b[1-9]\\b").gen()]), "shipDate": faker.date.anytime(), "shipTime": faker.date.anytime() },
        ...data || {}
    };
}
