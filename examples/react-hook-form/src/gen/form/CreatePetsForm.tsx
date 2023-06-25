import { useForm } from 'react-hook-form'
import type { CreatePetsMutationResponse } from '../models'

/**
 * @summary Create a pet
 * @link /pets
 */

type Props = {
  onSubmit?: (data: CreatePetsMutationResponse) => Promise<void> | void
}

export function CreatePetsForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePetsMutationResponse>({
    defaultValues: {
      name: '',
      tag: '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => {
        onSubmit?.(data)
      })}
    >
      <label>name</label>
      <input {...register('name', { required: true })} defaultValue="" />
      {errors['name'] && <p>This field is required</p>}

      <label>tag</label>
      <input {...register('tag', { required: true })} defaultValue="" />
      {errors['tag'] && <p>This field is required</p>}

      <input type="submit" />
    </form>
  )
}
