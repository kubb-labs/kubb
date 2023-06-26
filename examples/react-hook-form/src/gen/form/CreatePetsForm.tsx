import { useForm, Controller } from 'react-hook-form'
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
        <label htmlFor="name">Name</label>
        <Controller
          name="name"
          render={({ field }) => <input {...field} id="name" />}
          control={control}
          defaultValue={'Lily'}
          rules={{
            required: true,
          }}
        />
        {errors['name'] && <p>This field is required</p>}

        <label htmlFor="tag">Tag</label>
        <Controller
          name="tag"
          render={({ field }) => <input {...field} id="tag" />}
          control={control}
          defaultValue={''}
          rules={{
            required: true,
          }}
        />
        {errors['tag'] && <p>This field is required</p>}
        <input type="submit" />
      </form>

      <DevTool id="createPets" control={control} styles={{ button: { position: 'relative' } }} />
    </>
  )
}
