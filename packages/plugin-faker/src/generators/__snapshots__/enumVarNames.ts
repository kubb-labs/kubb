export function enumVarNames() {
  return faker.helpers.arrayElement<any>(['Pending', 'Received'])
}
