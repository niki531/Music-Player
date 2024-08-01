import Vue from 'vue';
import Router from 'vue-router';
import LoginPage from '../components/LoginPage.vue';
import ExplorePage from '../components/ExplorePage.vue';
import LibraryPage from '../components/LibraryPage.vue';
import SigninPage from '../components/SigninPage.vue';
import PlaylistPage from '../components/PlaylistPage.vue';
import AlbumPage from '../components/AlbumPage.vue';
import UserPage from '../components/UserPage.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', name:'Default',redirect: '/user/login' },
    { path: '/user/login', name:'Login', component: LoginPage },
    { path: '/explore', name:'Explore',component: ExplorePage },
    { path: '/library', name:'Library',component: LibraryPage },
    { path: '/user/signin', name:'SignIn',component: SigninPage },
    { path: '/playlist/:pid', name:'Playlist',component: PlaylistPage },
    { path: '/album/:pid', name:'Album',component: AlbumPage },
    { path: '/user/me', name:'User',component: UserPage },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});

