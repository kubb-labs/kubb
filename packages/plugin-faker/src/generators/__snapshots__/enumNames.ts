export function enumNames() {
  return faker.helpers.arrayElement<any>(['Pending', 'Received'])
}
