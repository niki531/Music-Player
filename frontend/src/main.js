import Vue from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import apiClient from './services/axios'; 
import vuetify from './plugins/vuetify'; 
Vue.config.productionTip = false;

new Vue({
  store,
  router,
  vuetify,
  render: h => h(App),
  async created() {
    const token = this.$store.getters.getToken;
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}).$mount('#app');
