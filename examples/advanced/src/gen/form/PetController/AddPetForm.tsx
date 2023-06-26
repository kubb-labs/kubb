import { useForm, Controller } from 'react-hook-form'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet
 */

type FieldValues = AddPetMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<AddPetMutationResponse> | void
}

export function AddPetForm(props: Props): React.ReactNode {
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
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        {/**
         * @description Create a new pet in the store
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
    </>
  )
}
