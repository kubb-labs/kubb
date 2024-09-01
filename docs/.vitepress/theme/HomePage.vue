<script setup>
const props = defineProps(['allContributors'])
</script>

<template>
  <div class="content">
    <div class="content-container">
      <main class="main">
        <div class="vp-doc flex flex-col items-center mt-10">
          <p align="center">
            <h2 id="the-team op50 font-normal pt-5 pb-2">
              Sponsors
            </h2>
            <a href="https://github.com/sponsors/stijnvanhulle">
              <img style="max-height: 300px;" src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors-circles.svg" alt="My sponsors" />
            </a>
          </p>
          <div class="action">
            <a
              class="fancy-sponsor"
              href="https://github.com/sponsors/stijnvanhulle"
              target="_blank"
              rel="noreferrer"
            >
              Sponsor us
            </a>
            <a class="sponsor" href="https://github.com/kubb-labs/kubb" rel="noopener noreferrer">Join the community</a>
          </div>
<!--          <HomeContributors :allContributors="props.allContributors"/>-->
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.action {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 4rem;
}

.items-center, [items-center=""] {
  align-items: center;
}
.flex-col, [flex-col=""], [flex~="col"] {
  flex-direction: column;
}
.flex, [flex=""], [flex~="~"] {
  display: flex;
}
.mt-10, [mt-10=""] {
  margin-top: 2.5rem;
}

.vp-doc h2 {
  margin: 48px 0 16px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 24px;
  letter-spacing: -.02em;
  line-height: 32px;
  font-size: 24px;
}
.vp-doc h1, .vp-doc h2, .vp-doc h3, .vp-doc h4, .vp-doc h5, .vp-doc h6 {
  position: relative;
  font-weight: 600;
  outline: none;
}
.op50, .op50\:, [op50=""] {
  opacity: .5;
}
.font-normal, [font-normal=""] {
  font-weight: 400;
}
.pt-5, [pt-5=""] {
  padding-top: 1.25rem;
}
.pb-2, [p~="b-2"], [pb-2=""] {
  padding-bottom: .5rem;
}
</style>
