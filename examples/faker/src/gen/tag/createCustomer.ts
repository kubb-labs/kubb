export function createCustomer(data?: Partial<Customer>): Customer {

  return {
    ...{"id": faker.number.int(),"username": faker.string.alpha(),"address": faker.helpers.multiple(() => (createAddress()))},
    ...data || {}
  }
}