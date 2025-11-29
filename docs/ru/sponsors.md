---
layout: page
---

<main class="main vp-doc">
  <div class="vp-doc flex flex-col items-center mt-10">
    <h1 id="op50 font-normal pt-5 pb-2">
      Спонсоры
    </h1>
    <a href="https://github.com/sponsors/stijnvanhulle">
      <img style="max-height: 300px;" src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
    </a>
  </div>

   <div class="action">
    <a
      class="fancy-sponsor"
      href="https://github.com/sponsors/stijnvanhulle"
      target="_blank"
      rel="noreferrer"
    >
      Поддержать нас
    </a>
    <a class="sponsor" href="https://github.com/kubb-labs/kubb" rel="noopener noreferrer">Присоединиться к сообществу</a>
  </div>
</main>

<style scoped>
.action {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 4rem;
}

.vp-doc h1, .vp-doc h2, .vp-doc h3, .vp-doc h4, .vp-doc h5, .vp-doc h6 {
  position: relative;
  font-weight: 600;
  outline: none;
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
</style>
