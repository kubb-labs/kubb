import { Alert, Button, Progress, Spacer } from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import DefaultLayout from '../layouts/default'

import type { StatusSchema } from '../models/StatusSchema.ts'
import { Fragment } from 'react'

function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch data')
      }

      return res.json() as Promise<StatusSchema>
    },
    refetchInterval: 200,
    refetchIntervalInBackground: true,
  })
}

function useRestart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return res.json()
    },
    onSuccess: async () => {
      return queryClient.invalidateQueries({ queryKey: ['status'] })
    },
  })
}

function useStop() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return res.json()
    },
    onSuccess: async () => {
      return queryClient.invalidateQueries({ queryKey: ['status'] })
    },
  })
}

function Status({ percentages }: { percentages: StatusSchema['percentages'] }) {
  return (
    <>
      {Object.entries(percentages || {}).map(([label, percentage]) => {
        return (
          <Fragment key={label}>
            <Progress aria-label="Loading..." size="sm" label={label} showValueLabel value={percentage * 100} />
            <Spacer y={4} />
          </Fragment>
        )
      })}
    </>
  )
}

export default function IndexPage() {
  const { data } = useStatus()
  const { mutateAsync: restart } = useRestart()
  const { mutateAsync: stop } = useStop()

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-2">
        <div className="inline-block max-w-lg text-center justify-center min-w-80">
          {!data && <Alert variant={'flat'} description={<>No connection to URL</>} />}

          {data?.name && (
            <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">{data.name}</span>
            </h1>
          )}
          {data?.percentages && <Status percentages={data?.percentages} />}
        </div>

        {data && (
          <div className="flex gap-3">
            <Button onPress={() => restart()}>Restart</Button>
            <Button onPress={() => stop()}>Stop</Button>
          </div>
        )}
      </section>
    </DefaultLayout>
  )
}
