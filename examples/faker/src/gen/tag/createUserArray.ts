export function createUserArray(data?: UserArray): UserArray {

  return [
        ...faker.helpers.multiple(() => (createUser())),
        ...data || []
      ]
}