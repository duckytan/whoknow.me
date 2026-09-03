/**
 * 路由表（SYSTEM_DESIGN.md §7.1）。
 * 基路径与 vite base 一致：'/workbench/'，配合根 vercel.json rewrite 解析深链。
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeDashboard from '@/pages/HomeDashboard.vue';
import AppDetail from '@/pages/AppDetail.vue';
import CandidateMatrix from '@/pages/CandidateMatrix.vue';
import CandidateList from '@/pages/CandidateList.vue';
import GovernanceView from '@/pages/GovernanceView.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeDashboard,
    meta: { title: '宇宙综合面板' },
  },
  {
    path: '/app/:key',
    name: 'app-detail',
    component: AppDetail,
    meta: { title: '子项目详情' },
  },
  {
    path: '/candidates',
    name: 'candidates',
    component: CandidateMatrix,
    meta: { title: '候选矩阵' },
  },
  {
    path: '/candidates/:categoryId',
    name: 'candidate-list',
    component: CandidateList,
    meta: { title: '候选清单' },
  },
  {
    path: '/governance',
    name: 'governance',
    component: GovernanceView,
    meta: { title: '治理透视' },
  },
];

export const router = createRouter({
  history: createWebHistory('/workbench/'),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '';
  document.title = title ? `${title} · 胡闹宇宙开发工作台` : '胡闹宇宙 · 开发工作台';
});

export default router;
