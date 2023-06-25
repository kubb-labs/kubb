import { useForm } from 'react-hook-form'
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
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        {/**
         * @description Update an existent pet in the store
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
