import Vue from 'vue';
import Vuex from 'vuex';
import apiClient from '../services/axios.js';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || ''
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearUser(state) {
      state.user = null;
      localStorage.removeItem('user');
    },
    setToken(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    clearToken(state) {
      state.token = '';
      localStorage.removeItem('token');
    }
  },
  actions: {
    login({ commit }, { user, token }) {
      commit('setUser', user);
      commit('setToken', token);
    },
    async logout({ commit }) {
      try{
        await apiClient.delete('/logout');
        commit('clearUser');
        commit('clearToken');
        console.log('Successfully logged out.');
      }catch (error) {
        console.error('Logout error:', error);
      }
    }
  },
  getters: {
    getUsername: state => state.user ? state.user.username : '',
    getUserId: state => state.user ? state.user.uid : null,
    getToken: state => state.token
  }
});
