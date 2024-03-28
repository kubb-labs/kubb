<script lang="ts">
import { computed, defineComponent, unref } from 'vue'
import { type FindPetsByStatusQueryParams, useFindPetsByStatus } from './index.ts'

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

    const petsQuery = useFindPetsByStatus(params, { query: { enabled: true } })
    const pets = computed(() => unref(petsQuery?.data))

    console.log(pets)
    //           ^?

    console.log(petsQuery.queryKey)
    //                        ^?

    const petsOverrideQuery = useFindPetsByStatus(params, {
      query: {
        queryKey: ['test'] as const,
        enabled: false,
        select: (data) => {
          const res = data.at(0)
          //    ^?
          return res
        },
      },
    })
    const petsOverride = computed(() => unref(petsOverrideQuery?.data))

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

