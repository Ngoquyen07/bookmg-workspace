import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from '../views/SearchPage.vue'
import BookDetailPage from '../views/BookDetailPage.vue'
import ShelfPage from '../views/ShelfPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'search', component: SearchPage },
    { path: '/books/:workId', name: 'book-detail', component: BookDetailPage },
    { path: '/shelf', name: 'shelf', component: ShelfPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() { return { top: 0 } },
})
