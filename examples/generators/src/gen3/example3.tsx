export function ListPets() {
  const href = '/pets'

  return (
    <>
      <a href={href}>Open get</a>
    </>
  )
}

export function CreatePets() {
  const href = '/pets'

  return (
    <>
      <a href={href}>Open post</a>
    </>
  )
}

export function ShowPetById() {
  const href = '/pets/:petId'

  return (
    <>
      <a href={href}>Open get</a>
    </>
  )
}
