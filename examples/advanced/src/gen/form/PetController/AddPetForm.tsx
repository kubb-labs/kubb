import { useForm } from 'react-hook-form'
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

        <label>name</label>
        <input {...register('name', { required: true })} defaultValue="" />
        {errors['name'] && <p>This field is required</p>}

        <label>name</label>
        <input {...register('name', { required: false })} defaultValue="" />

        <input type="submit" />
      </form>
    </>
  )
}
