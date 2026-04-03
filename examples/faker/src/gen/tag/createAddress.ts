export function createAddress(data?: Partial<Address>): Address {

  return {
    ...{"street": faker.string.alpha(),"city": faker.string.alpha(),"state": faker.string.alpha(),"zip": faker.string.alpha(),"identifier": [faker.number.int(), faker.string.alpha(), faker.helpers.arrayElement<any>(["NW", "NE", "SW", "SE"])]},
    ...data || {}
  }
}