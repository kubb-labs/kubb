<script setup>
import { computed } from 'vue'
const props = defineProps(['allContributors'])

const contributors = computed(() => props.allContributors.contributors)
</script>

<template>
  <div flex="~ wrap gap2" justify-center>
    <a v-for="{ login, name, avatar_url } of contributors" :key="login" :href="`https://github.com/${login}`" m-0
      rel="noopener noreferrer" :aria-label="`${name} on GitHub`">
      <img loading="lazy" :src="avatar_url" width="50" height="50" rounded-full h-12 w-12 :alt="`${name}'s avatar`">
    </a>
  </div>
</template>

<style scoped>
.gap2,
[flex~="gap2"],
[gap2=""] {
  grid-gap: .5rem;
  gap: .5rem;
}

.justify-center,
[justify-center=""] {
  justify-content: center;
}

[flex~="wrap"] {
  flex-wrap: wrap;
}

.flex,
[flex=""],
[flex~="~"] {
  display: flex;
}

.vp-doc a {
  font-weight: 500;
  color: var(--vp-c-brand);
  text-decoration-style: dotted;
  transition: color .25s;
}

.rounded-full, [rounded-full=""] {
  border-radius: 9999px;
}
.w-12, [w-12=""] {
  width: 3rem;
}
.h-12, [h-12=""] {
  height: 3rem;
}
</style>