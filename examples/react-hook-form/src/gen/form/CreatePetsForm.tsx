import { useForm } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'
import type { CreatePetsMutationRequest, CreatePetsMutationResponse } from '../models'

/**
 * @summary Create a pet
 * @link /pets
 */

type FieldValues = CreatePetsMutationRequest

type Props = {
  onSubmit?: (data: FieldValues) => Promise<CreatePetsMutationResponse> | void
}

export function CreatePetsForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: 'Lily',
      tag: undefined,
    },
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          onSubmit?.(data)
        })}
      >
        <label>Name</label>
        <input {...register('name', { required: true })} defaultValue="Lily" />
        {errors['name'] && <p>This field is required</p>}

        <label>Tag</label>
        <input {...register('tag', { required: true })} defaultValue="" />
        {errors['tag'] && <p>This field is required</p>}
        <input type="submit" />

        <DevTool id="createPets" control={control} styles={{ button: { position: 'relative' } }} />
      </form>
    </>
  )
}
