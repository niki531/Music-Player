<template>
  <v-container class="user-page">
    <v-row justify="center">
      <v-col cols="12" md="8" >
        <v-card>
          <v-card-title class="headline">User Information</v-card-title>
          <v-card-text>
            <div v-if="user">
              <p><strong>User ID:</strong> {{ user.uid }}</p>
              <p><strong>Username:</strong> {{ user.name }}</p>
              <p><strong>Subscription:</strong> {{ user.subscribe }}</p>
              <p><strong>Subscription Expires:</strong> {{ formatDate(user.subscribe_expired) }}</p>
            </div>
            <v-btn color="primary" @click="logout">Logout</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import apiClient from '../services/axios';

export default {
  data() {
    return {
      user: null,
    };
  },
  created() {
    this.fetchUserInfo();
  },
  methods: {
    async fetchUserInfo() {
      try {
        const response = await apiClient.get('/mypage');
        this.user = response.data.user;
      } catch (error) {
        console.error('Error fetching user info:', error);
        this.$router.push('/user/login'); 
      }
    },
    formatDate(date) {
      if (!date) return 'N/A';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(date).toLocaleDateString(undefined, options);
    },
    logout() {
      this.$store.dispatch('logout');
      this.$router.push('/user/login');
    },
  },
};
</script>

<style scoped>
.user-page {
  margin-top: 20px;
}

.headline {
  margin-bottom: 20px;
}
</style>
