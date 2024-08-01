<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card dark>
      <v-card-title>Create New Playlist</v-card-title>
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field label="Playlist Name" v-model="playlistName" :rules="[v => !!v || 'Name is required']"
          required></v-text-field>
          <v-text-field label="Descirption" v-model="description"></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="dialog = false">Cancel</v-btn>
        <v-btn color="blue darken-1" text @click="createPlaylist" :disabled="!valid">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import apiClient from '../services/axios';

export default {
  data() {
    return {
      valid:false,
      dialog: false,
      playlistName: '',
      description: '',
    };
  },
  methods: {
    open() {
      this.dialog = true;
    },
    async createPlaylist() {
      try {
        const response = await apiClient.post('/playlist/create', { 
            name: this.playlistName, 
            description: this.description
        });
        console.log('playlist is created!');
        const newPlaylist = response.data; 
        await apiClient.post(`/track/library`, { type: 'playlist', id: newPlaylist.pid });
        console.log('playlist is added to user library!');
        this.$emit('playlist-created');
        this.dialog = false; 
        console.log('playlist is added to user library!');
      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    }
  }
};
</script>
