<template>
  <v-container class="playlist-page">
    <v-row>
      <v-col cols="12" sm="4">
        <v-card>
          <v-img :src="playlistCover" aspect-ratio="1"></v-img>
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <div class="playlist-name">{{ playlist.name }}</div>
              <v-card-subtitle>{{ playlist.author }}</v-card-subtitle>
            </div>
            <div>
            <v-btn icon dense @click="addPlaylistToLibrary(playlist.pid)">
              <v-icon>mdi-star</v-icon>
            </v-btn>
              <v-btn icon dense @click="confirmDeletePlaylist" v-if="isAuthor">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </v-card-title>
        </v-card>
      </v-col>
      <v-col cols="12" sm="8">
        <v-list>
          <v-list-item
            v-for="(track, index) in tracks"
            :key="track.track_id"
          >
            <v-list-item-content>
              <v-list-item-title>{{ track.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ cleanAuthor(track.artist) }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-row dense>
                <v-col cols="auto">
                  <v-btn icon dense @click="playTrack(track, index)">
                    <v-icon>mdi-play-circle</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn icon dense @click="addTrackToLibrary(track.track_id)">
                    <v-icon>mdi-star</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                    <v-btn icon dense @click="openSaveToPlaylist(track.track_id)">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                </v-col>
                <v-col cols="auto" v-if="isAuthor">
                    <v-btn icon dense @click="removeFromPlaylist(track.track_id)">
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                </v-col>
              </v-row>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="500">
      <SaveToPlaylist :trackId="selectedTrackId" @track-saved="onTrackSaved" @closed ="onClosed"/>
    </v-dialog>
    <v-dialog v-model="confirmDeleteDialog" max-width="500">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>Are you sure you want to delete this playlist?</v-card-text>
        <v-card-actions>
          <v-btn color="red" text @click="deletePlaylist">Yes</v-btn>
          <v-btn text @click="confirmDeleteDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" top :timeout="3000" color="info">
      {{ snackbarText }}
      <v-btn color="white" text @click="snackbar = false">Close</v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import apiClient from '../services/axios';
import SaveToPlaylist from './SaveToPlaylist.vue';

export default {
  components: {
    SaveToPlaylist
  },
  data() {
    return {
      playlist: {},
      tracks: [],
      playlistCover: '',
      snackbar: false,
      snackbarText: '',
      dialog: false,
      selectedTrackId: null,
      selectedPlaylistId: null,
      confirmDeleteDialog: false,
      isAuthor: false,
      uid: '' 
    };
  },
  async created() {
    const { pid } = this.$route.params;
    this.uid = this.$store.getters.getUserId;
    try {
      const playlistResponse = await apiClient.get(`/playlist-service/playlist/${pid}`);
      console.log(playlistResponse.data);
      this.playlist = playlistResponse.data; 
      this.isAuthor = (this.playlist.author_uid === this.uid);   
      await this.fetchPlaylistCover(pid);
      const trackDetails = await Promise.all(
        this.playlist.tracks.map(async (track) => {
          const trackResponse = await apiClient.get(`/track-service/track/${track.tid}`);
          return trackResponse.data.data;
        })
      );
      this.tracks = trackDetails;
      await this.fetchPlaylistCover(pid);
    } catch (error) {
      console.error('Error fetching playlist details:', error);
    }
  },
  methods: {
    getUserId() {
      return this.$store.getters.getUserId;
    },
    async fetchPlaylistCover(pid) {
      try {
        const response = await apiClient.get(`/image-service/image/${pid}`, { responseType: 'blob' });
        this.playlistCover = URL.createObjectURL(response.data);
      } catch (error) {
        console.error(`Error fetching playlist cover for ${pid}:`, error);
        try {
          const response = await apiClient.get(`/image-service/image/default-playlist-cover`, { responseType: 'blob' });
          this.playlistCover = URL.createObjectURL(response.data);
        } catch (defaultError) {
          console.error('Error fetching default playlist cover:', defaultError);
          this.playlistCover = 'default-cover.jpg'; 
        }
      }
    },
    cleanAuthor(author) {
      if (Array.isArray(author)) {
        author = author.join(', ');
      }
      return author.replace(/[["\]]/g, '');
    },
    async playTrack(track, index) {
      const { pid } = this.$route.params;
      try {
        const trackResponse = await apiClient.get(`/stream-service/stream/${track.track_id}`, { responseType: 'blob' });
        const trackSrc = URL.createObjectURL(trackResponse.data);
        const trackData = await this.getTrackData(track.track_id);
        const coverUrl = await this.getCoverUrl(trackData.album_id);
        const updatedTracks = await Promise.all(this.tracks.map(async (t) => {
          const tResponse = await apiClient.get(`/stream-service/stream/${t.track_id}`, { responseType: 'blob' });
          const tSrc = URL.createObjectURL(tResponse.data);
          return {
            src: tSrc,
            title: t.title,
            subtitle: this.cleanAuthor(t.artist),
            tid: t.track_id,
            album_id: pid
          };
        }));

        this.$root.$emit('play-track', {
          src: trackSrc,
          title: track.title,
          subtitle: this.cleanAuthor(track.artist),
          tid: track.track_id,
          album_id: pid
        }, updatedTracks, index, coverUrl);
      } catch (error) {
        console.error('Error fetching track stream:', error);
      }
    },
    async addTrackToLibrary(trackId) {
      try {
        const uid = this.getUserId(); 
        await apiClient.post('/user-library-service/track-library', { uid, type: 'track', id: trackId });
        this.snackbarText = 'Track added to your favorites';
        this.snackbar = true;
      } catch (error) {
        console.error('Error adding track to library:', error);
        if (error.response && error.response.status === 400) {
          this.snackbarText = 'Track already exists in your favorites';
        } else{
          this.snackbarText = 'Failed to add track to your favorites';
        }
        this.snackbar = true;
      }
    },
    async addPlaylistToLibrary(pid) {
      try {
        const uid = this.getUserId(); 
        await apiClient.post('/user-library-service/track-library', { uid, type: 'playlist', id: pid });
        this.snackbarText = 'Playlist added to your favorites';
        this.snackbar = true;
      } catch (error) {
        console.error('Error adding playlist to library:', error);
        if (error.response && error.response.status === 400) {
          this.snackbarText = 'Playlist already exists in your favorites';
        } else{
          this.snackbarText = 'Failed to add track to your favorites';
        }
        this.snackbar = true;
      }
    },
    async getCoverUrl(pid) {
      if (!pid) {
        return 'default-cover.jpg';
      }
      try {
        const response = await apiClient.get(`/image-service/image/${pid}`, { responseType: 'blob' });
        const coverUrl = URL.createObjectURL(response.data);
        return coverUrl;
      } catch (error) {
        //console.error('Error fetching cover:', error);
        return 'default-cover.jpg';
      }
    },
    async getTrackData(tid) {
      try {
        const response = await apiClient.get(`/track-service/track/${tid}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching track data:', error);
        return {
          name: 'Unknown Track',
          artist: 'Unknown Artist',
        };
      }
    },
    openSaveToPlaylist(trackId) {
      this.selectedTrackId = trackId;
      this.dialog = true;
      console.log("dialog should be open");
    },
    onTrackSaved() {
      console.log('Track saved to playlist');
      this.dialog = false;
      this.snackbarText = 'Track added to this playlist';
      this.snackbar = true;
    },
    onClosed() {
      console.log('Track saved to playlist');
      this.dialog = false;
    },
    async removeFromPlaylist(tid) {
      const { pid } = this.$route.params;
      try {
        await apiClient.delete(`/playlist-service/remove-playlist`, {
          params: {
            pid: pid,
            trackId: tid
          }
        });
        this.tracks = this.tracks.filter(track => track.track_id !== tid);
        this.snackbarText = 'Track removed from the playlist';
        this.snackbar = true;
      } catch (error) {
        console.error('Error removing track from playlist:', error);
        if (error.response && error.response.status === 403) {
          this.snackbarText = 'You cannot remove tracks from this playlist';
        } else {
          this.snackbarText = 'Failed to remove track from the playlist';
        }
        this.snackbar = true;
      }
    },
    confirmDeletePlaylist() {
      this.confirmDeleteDialog = true;
    },
    async deletePlaylist() {
      const { pid } = this.$route.params;
      try {
        const response = await apiClient.delete(`/playlist-service/playlist/${pid}`);
        const response2 = await apiClient.delete(`/user-library-service/library-playlist/${pid}`);
        if (response.status === 200 && response2.status===200) {
          this.snackbarText = 'Playlist deleted successfully';
          this.$router.push('/library');
        } else {
          this.snackbarText = 'Failed to delete playlist';
        }
        this.snackbar = true;
      } catch (error) {
        console.error('Error deleting playlist:', error);
        this.snackbarText = 'Failed to delete playlist';
        this.snackbar = true;
      }
      this.confirmDeleteDialog = false;
    },
  },
};
</script>

<style scoped>
.playlist-page {
  background-color: #121212;
  padding: 20px;
}

.v-list-item-action {
  display: flex;
  align-items: center;
}

.v-row {
  display: flex;
  align-items: center;
}

.playlist-name {
  font-size: 1.25rem;
  font-weight: bold;
  text-indent: 0.8em;
  word-break: break-word;
}
</style>
