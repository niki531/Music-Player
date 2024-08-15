<template>
  <v-container>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <span class="headline">Sign Up</span>
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleSignUp">
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
              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                type="password"
                required
              ></v-text-field>
              <v-btn type="submit" color="primary" block>Sign Up</v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text to="/user/login">Login</v-btn>
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
      confirmPassword: '',
    };
  },
  methods: {
    async handleSignUp() {
      try {
        if (this.password !== this.confirmPassword) {
          alert("Passwords do not match");
          return;
        }

        const response = await apiClient.post('/user/register', {
          username: this.username,
          password: this.password,
        });

        const token = response.data.token;
        localStorage.setItem('jwtToken', token);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        console.log('Sign Up successful:', response.data);
        this.$router.push('/explore');
      } catch (error) {
        console.error('Sign Up failed:', error);
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
