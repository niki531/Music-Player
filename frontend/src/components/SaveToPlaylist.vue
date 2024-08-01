<template>
  <v-card dark>
    <v-row>
        <v-col cols="6" class="title">
            <v-card-title>Save to Playlist</v-card-title>
        </v-col>
        <v-col cols="6" class="d-flex justify-end">
            <v-card-actions>
            <v-btn @click="$emit('closed')">&#x2715;</v-btn>
            </v-card-actions>
        </v-col>
    </v-row>
    <hr>
    <v-card-text>
      <v-list>
        <v-list-item v-for="playlist in playlists" :key="playlist.id">
          <v-list-item-content>
            <v-list-item-title>{{ playlist.name }}</v-list-item-title>
          </v-list-item-content >
          <v-list-item-action>
            <v-btn @click="saveToPlaylist(playlist.pid)">Save</v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-list-item v-if="playlists.length === 0">
          <v-list-item-content class="empty-text">
            <v-list-item-title >You haven't created any playlists</v-list-item-title>
            <v-list-item-subtitle>All your playlists will show up here</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
    <hr>
    <v-card-actions class="justify-center">
      <v-btn @click="openNewPlaylist">+ New Playlist</v-btn>
    </v-card-actions>
    <NewPlaylist ref="NewPlaylist" @playlist-created="fetchUserPlaylists" />
    <v-snackbar v-model="snackbar" top :timeout="3000" color="info">
      {{ snackbarText }}
      <v-btn color="white" text @click="snackbar = false">Close</v-btn>
    </v-snackbar>
  </v-card>
</template>

<script>
import apiClient from '../services/axios';
import NewPlaylist from './NewPlaylist.vue';

export default {
  props: ['trackId'],
  data() {
    return {
      playlists: [],
      snackbar: false,
      snackbarText: ''
    };
  },
  components: {
    NewPlaylist
  },
  async created() {
    await this.fetchUserPlaylists(); 
  },
  methods: {
    async saveToPlaylist(playlistId) {
      try {
        await apiClient.put(`/playlist/${playlistId}`, { trackId: this.trackId });
        this.$emit('track-saved');
      } catch (error) {
        console.error('Error saving track to playlist:', error);
        if (error.response && error.response.status === 400) {
          this.snackbarText = 'Track already exists in this playlist';
        } else{
          this.snackbarText = 'Failed to add track to this playlist';
        }
        this.snackbar = true;
      }
    },
    async getPlaylistData(pid) {
      try {
        const response = await apiClient.get(`/playlist/${pid}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching playlist data:', error);
        return {
          name: 'Unknown Playlist',
          artist: 'Unknown Artist',
        };
      }
    },
    openNewPlaylist() {
      this.$refs.NewPlaylist.open();
    },
    async fetchUserPlaylists() {
      try {
        const response = await apiClient.get('/myplaylists');
        console.log('playlist info:', response.data.data);
        const playlist = response.data.data;
        this.playlists = await Promise.all(playlist.map(async item => {
          const playlistData = await this.getPlaylistData(item.pid);
          return {
            id: item.id,
            pid: playlistData.pid,
            name: playlistData.name,
          };
        }));
        console.log('playlist length is ', response.data.data.length);
      } catch (error) {
        console.error(`Error fetching playlist:`, error);
      }
    }
  }
}
</script>

<style scoped>
.headline {
  font-weight: bold;
}
.empty-text {
    padding-top:20px;
  text-align: center;
}
.title {
  display: flex;
  align-items: center;
  padding-left: 5%;
}
.justify-end {
    display: flex;
  justify-content: flex-end;
  align-items: center;
  display: fixed;
}
.justify-center {
  display: flex;
  justify-content: center;
}
</style>

