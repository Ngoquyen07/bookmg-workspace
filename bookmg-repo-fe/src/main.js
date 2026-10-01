import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import Toast from 'vue-toastification'
import './style.css'
import 'vue-toastification/dist/index.css'

createApp(App).use(router).use(Toast, { position: 'top-right', timeout: 3000 }).mount('#app')
