import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from '../views/SearchPage.vue'
import BookDetailPage from '../views/BookDetailPage.vue'
import ShelfPage from '../views/ShelfPage.vue'
import DashboardPage from '../views/DashboardPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage, beforeEnter: to => Object.hasOwn(to.query, 'q') ? { name: 'search', query: to.query } : undefined },
    { path: '/discover', name: 'search', component: SearchPage },
    { path: '/books/:workId', name: 'book-detail', component: BookDetailPage },
    { path: '/shelf', name: 'shelf', component: ShelfPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() { return { top: 0 } },
})
