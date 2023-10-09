<script lang="ts">
import { defineComponent, computed, unref } from 'vue';
import { useFindPetsByStatus, FindPetsByStatusQueryParams } from './index.ts';

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
    const params = computed(() =>{
      return {
        status: props.status as FindPetsByStatusQueryParams["status"]
      }
    })
    
    const petsQuery = useFindPetsByStatus(params)
    const pets = computed(() => unref(petsQuery?.data));

    return {
      pets
    };
  },
});
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

