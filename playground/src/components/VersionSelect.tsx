import useSWR from 'swr'
import { useAtom } from 'jotai'
import { CircularProgress, Flex, Heading, Select, Text } from '@chakra-ui/react'

import { versionAtom } from '../kubb'
import { useBgColor, useBorderColor } from '../utils'

import type { ChangeEvent } from 'react'

type PackageInfo = {
  tags: {
    latest: string
  }
  versions: string[]
}

const fetchVersions = (packageName: string): Promise<PackageInfo> =>
  fetch(`https://data.jsdelivr.com/v1/package/npm/${packageName}`).then((response) => response.json())

interface Props {
  isLoading: boolean
}

export default function VersionSelect({ isLoading }: Props) {
  const [version, setVersion] = useAtom(versionAtom)
  const { data, error } = useSWR('@kubb/core', fetchVersions)
  const bg = useBgColor()
  const borderColor = useBorderColor()

  const handleCurrentVersionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setVersion(event.target.value)
  }

  return (
    <Flex direction="column">
      <Heading size="md" mb="8px">
        Version
      </Heading>
      <Flex direction="column" p="2" bg={bg} borderColor={borderColor} borderWidth="1px">
        {data ? (
          <Select disabled value={version} onChange={handleCurrentVersionChange}>
            {data.versions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </Select>
        ) : (
          <Select>
            <option>{version}</option>
          </Select>
        )}
        <Flex alignItems="center" my="2" height="8">
          {isLoading ||
            (!data && !error && (
              <>
                <CircularProgress size="7" isIndeterminate />
                <Text ml="2">Please wait...</Text>
              </>
            ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
