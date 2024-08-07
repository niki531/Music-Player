<template>
  <v-container class="album-page">
    <v-row>
      <v-col cols="12" sm="4">
        <v-card>
          <v-img :src="albumCover" aspect-ratio="1"></v-img>
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <div class="album-name">{{ album.name }}</div>
              <v-card-subtitle>{{ album.author }}</v-card-subtitle>
            </div>
            <v-btn icon dense @click="addAlbumToLibrary(album.pid)">
              <v-icon>mdi-star</v-icon>
            </v-btn>
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
              </v-row>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="500">
      <SaveToPlaylist :trackId="selectedTrackId" @track-saved="onTrackSaved" @closed ="onClosed"/>
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
      album: {},
      tracks: [],
      albumCover: '',
      snackbar: false,
      snackbarText: '',
      dialog: false,
      selectedTrackId: null
    };
  },
  async created() {
    const { pid } = this.$route.params;
    try {
      const albumResponse = await apiClient.get(`/album-service/album/${pid}`);
      this.album = albumResponse.data.data;
      await this.fetchAlbumCover(pid); 
      const trackDetails = await Promise.all(
        this.album.tracks.map(async (track) => {
          const trackResponse = await apiClient.get(`/track-service/track/${track.tid}`);
          return trackResponse.data.data;
        })
      );      
      this.tracks = trackDetails;
    } catch (error) {
      console.error('Error fetching album details:', error);
    }
  },
  methods: {
    async fetchAlbumCover(pid) {
      try {
        const response = await apiClient.get(`/image-service/image/${pid}`, { responseType: 'blob' });
        this.albumCover = URL.createObjectURL(response.data);
      } catch (error) {
        console.error('Error fetching album cover:', error);
        this.albumCover = 'default-album-cover.jpg';
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
        }, updatedTracks, index, this.albumCover);
      } catch (error) {
        console.error('Error fetching track stream:', error);
      }
    },
    async addTrackToLibrary(trackId) {
      try {
        await apiClient.post('/user-library-service/track/library', { type: 'track', id:trackId });
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
    async addAlbumToLibrary(pid) {
      try {
        await apiClient.post('/user-library-service/track/library', { type: 'album', id:pid });
        this.snackbarText = 'Album added to your favorites';
        this.snackbar = true;
      } catch (error) {
        console.error('Error adding album to library:', error);
        if (error.response && error.response.status === 400) {
          this.snackbarText = 'Album already exists in your favorites';
        } else{
          this.snackbarText = 'Failed to add album to your favorites';
        }
        this.snackbar = true;
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
    }
  }
};
</script>

<style scoped>
.album-page {
  background-color: #121212;
  padding: 20px;
  padding-bottom: 1000px;
  margin-bottom: 1000px;
}

.v-list-item-action {
  display: flex;
  align-items: center;
}

.v-row {
  display: flex;
  align-items: center;
}
.album-name {
  font-size: 1.25rem;
  font-weight: bold;
  text-indent: 0.8em;
  word-break: break-word;

}
</style>
