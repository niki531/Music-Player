<template>
  <v-container class="library-page" fluid>
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="favorites-section" dark>
          <v-card-title>My Favorites</v-card-title>
          <v-row>
            <v-col cols="12" sm="6" md="12">
              <v-btn block color="white" @click="fetchLibrary('album')">
                <div class="text">Albums</div>
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" md="12">
              <v-btn block color="white" @click="fetchLibrary('track')">
                <div class="text">Tracks</div>
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" md="12">
              <v-btn block color="white" @click="fetchLibrary('playlist')">
                <div class="text">Playlists</div>
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
      <v-col cols="12" md="9" >
        <template v-if="currentType === 'album'">
          <v-row justify="start">
            <v-col v-for="item in library" :key="item.id" cols="12" sm="6" md="4" lg="3">
              <v-card class="library-item-card" :to="{ name: 'Album', params: { pid: item.id } }">
                <v-img v-if="item.coverUrl" :src="item.coverUrl" aspect-ratio="1.7" class="library-item-img"></v-img>
                <v-card-title class="library-item-title">{{ item.name }}</v-card-title>
                <v-card-subtitle class="library-item-subtitle">{{ item.artist }}</v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>
        </template>
        <template v-else-if="currentType === 'track'">
          <v-list class="trackStyle">
            <v-list-item v-for="(item,index) in library" :key="item.id">
              <v-list-item-content>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ cleanAuthor(item.artist) }}</v-list-item-subtitle>
              </v-list-item-content>
                <v-list-item-action>
                <v-row dense>
                  <v-col cols="auto">
                    <v-btn icon dense @click="playTrack(item, index)">
                      <v-icon>mdi-play-circle</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon dense @click="openSaveToPlaylist(item.id)">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </template>
        <template v-else>
          <v-row justify="start">
            <v-col v-for="item in library" :key="item.id" cols="12" sm="6" md="4" lg="3">
              <v-card class="library-item-card" :to="{ name: 'Playlist', params: { pid: item.id } }">
                <v-img v-if="item.coverUrl" :src="item.coverUrl" aspect-ratio="1.7" class="library-item-img"></v-img>
                <v-card-title class="library-item-title">{{ item.name }}</v-card-title>
                <v-card-subtitle class="library-item-subtitle">{{ item.artist }}</v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="500">
      <SaveToPlaylist :trackId="selectedTrackId" @track-saved="onTrackSaved" @closed ="onClosed" />
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
  name: 'LibraryPage',
  components: {
    SaveToPlaylist
  },
  data() {
    return {
      library: [],
      snackbar: false,
      snackbarText: '',
      coverUrls: {},
      currentType: '',
      dialog: false,
      selectedTrackId: null
    };
  },
  async created (){
    this.fetchLibrary('playlist');
  },
  methods: {
    async fetchLibrary(type) {
      this.currentType = type;
      try {
        const response = await apiClient.get('/user-library-service/library', { params: { type } });
        console.log(`Fetched ${type}: `, response.data.data);
        this.library = await Promise.all(response.data.data.map(async item => {
          let coverUrl = this.coverUrls[item.id];
          if (!coverUrl) {
            coverUrl = await this.getCoverUrl(item.id);
            this.$set(this.coverUrls, item.id, coverUrl);
          }
          if (type === 'album') {
            const albumData = await this.getAlbumData(item.id);
            return {
              id: item.id,
              name: albumData.name,
              artist: albumData.author,
              coverUrl: coverUrl,
            };
          } else if (type === 'track'){
            const trackData = await this.getTrackData(item.id);
            return {
              id: item.id,
              name: trackData.title,
              artist: trackData.artist,
            };
          } else if (type === 'playlist'){
            const playlistData = await this.getPlaylistData(item.id);
            console.log('successfully fetched data:',playlistData);
            return {
              id: item.id,
              name: playlistData.name,
              artist: playlistData.author,
              coverUrl: coverUrl,
            };
          }
          else {
            return {
              id: item.id,
              name: item.name,
              artist: item.author,
              coverUrl: coverUrl,
            };
          }
        }));
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
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
      console.error(`Error fetching cover for ${pid}:`, error);
      try {
        const response = await apiClient.get(`/image-service/image/default-playlist-cover`, { responseType: 'blob' });
        const coverUrl = URL.createObjectURL(response.data);
        return coverUrl;
      } catch (defaultError) {
        console.error('Error fetching default cover:', defaultError);
        return 'default-cover.jpg';
      }
    }
  },
    async getAlbumData(pid) {
      try {
        const response = await apiClient.get(`/album-service/album/${pid}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching album data:', error);
        return {
          name: 'Unknown Album',
          artist: 'Unknown Artist',
        };
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
    async getPlaylistData(pid) {
      try {
        const response = await apiClient.get(`/playlist-service/playlist/${pid}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching playlist data:', error);
        return {
          name: 'Unknown Playlist',
          artist: 'Unknown Artist',
        };
      }
    },
    cleanAuthor(author) {
      if (Array.isArray(author)) {
        author = author.join(', ');
      }
      return author.replace(/[["\]]/g, '');
    },
    async playTrack(track, index) {
      try {
        const trackResponse = await apiClient.get(`/stream-service/stream/${track.id}`, { responseType: 'blob' });
        const trackSrc = URL.createObjectURL(trackResponse.data);
        const trackData = await this.getTrackData(track.id);
        const coverUrl = await this.getCoverUrl(trackData.album_id);
        const updatedTracks = await Promise.all(this.library.map(async (t) => {
          const tResponse = await apiClient.get(`/stream-service/stream/${t.id}`, { responseType: 'blob' });
          const tSrc = URL.createObjectURL(tResponse.data);
          return {
            src: tSrc,
            title: t.name,
            subtitle: this.cleanAuthor(t.artist),
            tid: t.id,
            album_id: t.album_id
          };
        }));

        this.$root.$emit('play-track', {
          src: trackSrc,
          title: track.name,
          subtitle: this.cleanAuthor(track.artist),
          tid: track.id,
          album_id: track.album_id,
          cover: coverUrl
        }, updatedTracks, index, coverUrl);
      } catch (error) {
        console.error('Error fetching track stream:', error);
      }
    },
    openSaveToPlaylist(trackId) {
      this.selectedTrackId = trackId;
      this.dialog = true;
      //console.log("dialog should be open");
    },
    onTrackSaved() {
      //console.log('Track saved to playlist');
      this.dialog = false;
      this.snackbarText = 'Track added to this playlist';
      this.snackbar = true;
    },
    onClosed() {
      this.dialog = false;
    }
  },
};

</script>

<style scoped>
.library-page {
  background-color: #121212;
  padding: 20px;
  padding-left:5%;
  padding-right:5%;
  display:flex;
}

.favorites-section {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 5px;
}

.library-item-card {
  background-color: white;
  margin-bottom: 20px;
}

.library-item-title {
  color: black;
  word-break: break-word;
}

.library-item-subtitle {
  color: gray;
}

.v-btn {
  margin-bottom: 10px;
}

.v-snackbar {
  width: auto;
  min-width: 300px;
  max-width: 50%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.text {
  color: black;
}
.trackStyle{
  margin-right: 10%;
}
</style>
