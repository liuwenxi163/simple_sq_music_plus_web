import { createRouter, createWebHashHistory } from 'vue-router'
import Studio from '../listening/Studio.vue'
export const router = createRouter({ history: createWebHashHistory(), routes: [
  { path: '/', redirect: '/daily' },
  ...Object.entries({ home: 'daily', v3search: 'search', V3Download: 'downloads', v3set: 'settings', V3ParserPlaylist: 'parser', V3Parsertext: 'text', Monitor: 'sync', AliyunSync: 'cloud', login: 'daily' }).map(([from, to]) => ({ path: '/' + from, redirect: '/' + to })),
  { path: '/:view(daily|library|favorites|search|downloads|tools|sync|enrichment|settings|parser|text|cloud)', component: Studio },
  { path: '/:pathMatch(.*)*', redirect: '/daily' }
] })
