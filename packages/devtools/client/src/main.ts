import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.css'

createApp(App).use(ui).mount('#app')
