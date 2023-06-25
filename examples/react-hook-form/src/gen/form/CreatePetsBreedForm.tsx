import { useForm } from 'react-hook-form'
import { DevTool } from '@hookform/devtools'
import type { CreatePetsBreedMutationResponse, CreatePetsBreedPathParams } from '../models'

/**
 * @summary Create a pet breed
 * @link /pets/:breed
 */

type Props = {
  onSubmit?: (data: CreatePetsBreedMutationResponse) => Promise<void> | void
  breed: CreatePetsBreedPathParams['breed']
}

export function CreatePetsBreedForm(props: Props): React.ReactNode {
  const { onSubmit } = props

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePetsBreedMutationResponse>({
    defaultValues: {
      name: '',
      tag: '',
    },
  })

  return (
    <>
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
        <DevTool id="createPetsBreed" control={control} styles={{ button: { position: 'relative' } }} />
      </form>
    </>
  )
}
