---
layout: page
---
<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'

import allContributorsStr from '../../.all-contributorsrc?raw'

const allContributors= JSON.parse(allContributorsStr)

const members =  allContributors?.contributors.map(item=>{
  return {
    avatar: item.avatar_url,
    name: item.name,
    title: item.contributions.join(','),
    links: [
      { icon: 'github', link: `https://github.com/${item.login}` },
      item.login==="stijnvanhulle"? { icon: 'twitter', link: "https://twitter.com/stijnvanhulle" }: undefined
    ].filter(Boolean)
  }
})
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      Our Team
    </template>
    <template #lead>
      The development of Kubb is guided by an international
      team, some of whom have chosen to be featured below.
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>