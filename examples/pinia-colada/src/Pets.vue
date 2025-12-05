<script lang="ts">
import { computed, defineComponent, toValue } from 'vue'
import { useFindPetsByStatus } from './gen/hooks/useFindPetsByStatus.ts'
import type { FindPetsByStatusQueryParams } from './gen/models/FindPetsByStatus.ts'

export default defineComponent({
  name: 'PetsList',
  emits: ['setStatus'],
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const params = computed(() => {
      return {
        status: props.status as FindPetsByStatusQueryParams['status'],
      }
    })

    const petsQuery = useFindPetsByStatus(params)
    const pets = computed(() => toValue(petsQuery?.data))

    console.log(pets)
    //           ^?

    console.log(petsQuery.queryKey)
    //                        ^?

    const petsOverrideQuery = useFindPetsByStatus(params, {
      query: {
        key: ['test'] as const,
      },
    })
    const petsOverride = computed(() => toValue(petsOverrideQuery?.data))

    console.log(petsOverride)
    //           ^?

    console.log(petsOverrideQuery.queryKey)
    //                              ^?

    return {
      pets,
    }
  },
})
</script>

<template>
  <div class="pets" v-if="pets">
    <h1>Pets: {{ status }}</h1>
    <ul v-for="pet in pets" :key="pet.id">
      <li :key="pet.id">{{pet.name}}</li>
    </ul>
  </div>
  <button @click="$emit('setStatus', 'available')" >Available</button>
  <button @click="$emit('setStatus', 'pending')" >Pending</button>
</template>

