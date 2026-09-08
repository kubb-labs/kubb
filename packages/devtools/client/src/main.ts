import { createApp } from 'vue'
import App from './App.vue'
import { setStaticReportData } from './devtools'
import './styles/index.css'

const reportData = document.getElementById('kubb-report-data')?.textContent
if (reportData) {
  setStaticReportData(JSON.parse(reportData))
}

createApp(App).mount('#app')
