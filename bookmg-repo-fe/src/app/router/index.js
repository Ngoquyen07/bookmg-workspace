import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from '../../features/books/pages/SearchPage.vue'
import BookDetailPage from '../../features/books/pages/BookDetailPage.vue'
import ShelfPage from '../../features/shelf/pages/ShelfPage.vue'

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
