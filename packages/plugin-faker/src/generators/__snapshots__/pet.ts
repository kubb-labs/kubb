import { faker } from "@faker-js/faker";

 export function pet(data: NonNullable<Partial<Pet>> = {}) {
    return {
        ...{ "id": faker.number.int(), "name": faker.string.alpha(), "tag": faker.string.alpha(), "code": faker.helpers.arrayElement<any>([faker.string.alpha(), faker.helpers.fromRegExp(new RegExp("\\b[1-9]\\b"))]), "shipDate": faker.date.anytime(), "shipTime": faker.date.anytime() },
        ...data
    };
}
