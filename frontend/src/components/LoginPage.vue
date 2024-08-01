// LoginPage.vue
<template>
  <v-container>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <span class="headline">Login</span>
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Username"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                required
              ></v-text-field>
              <v-checkbox
                v-model="rememberMe"
                label="Remember Me"
              ></v-checkbox>
              <v-btn type="submit" color="primary" block>Login</v-btn>
            </v-form>
            <v-alert v-if="error" type="error" dismissible>{{ error }}</v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text to="/user/signin">Sign In</v-btn>
          </v-card-actions>
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
      username: '',
      password: '',
      rememberMe: false,
      error: '',
    };
  },
  methods: {
    async handleLogin() {
      this.error = '';
      try {
        const response = await apiClient.post('/user/login', {
          username: this.username,
          password: this.password,
        });

        const { token, user } = response.data;
        this.$store.dispatch('login', { user, token });
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Login successful:', response.data);
        this.$router.push('/explore');
      } catch (error) {
        if (error.response) {
          this.error = error.response.data.msg;
        } else {
          this.error = 'An error occurred during login.';
        }
        console.error('Login failed:', error);
      }
    }
  }
};
</script>

<style>
.fill-height {
  height: 100%;
}
</style>
