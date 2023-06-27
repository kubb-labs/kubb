import { useForm, Controller } from 'react-hook-form'
import type { UpdatePetMutationRequest, UpdatePetMutationResponse } from '../../models/ts/petController/UpdatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * @link /pet
 */

type FieldValues = UpdatePetMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<UpdatePetMutationResponse> | void
}

export function UpdatePetForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: undefined,
      status: undefined,
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        onSubmit?.(data)
      })}
    >
      {/**
       * @description Update an existent pet in the store
       */}

      <label htmlFor="name">Name</label>
      <Controller
        name="name"
        render={({ field }) => <input {...field} id="name" />}
        control={control}
        defaultValue={''}
        rules={{
          required: true,
        }}
      />
      {errors['name'] && <p>This field is required</p>}

      <label htmlFor="name">Name</label>
      <Controller
        name="category.name"
        render={({ field }) => <input {...field} id="category.name" />}
        control={control}
        defaultValue={''}
        rules={{
          required: false,
        }}
      />

      <input type="submit" />
    </form>
  )
}
