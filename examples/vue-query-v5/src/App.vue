<script lang="ts">
import { defineComponent, ref } from 'vue';
import { FindPetsByStatusQueryParamsStatus } from './index.ts';
import Pets from "./Pets.vue"

export default defineComponent({
  name: 'App',
  components: { Pets },
  setup() {
    const status = ref<FindPetsByStatusQueryParamsStatus>("available")

    return {
      status,
      setStatus(newStatus:FindPetsByStatusQueryParamsStatus ){
        status.value= newStatus
      }
    };
  },
});
</script>

<template>
  <Pets :status="status" @setStatus="setStatus" />
</template>

