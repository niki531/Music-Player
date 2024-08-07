<template>
  <v-container class="explore-page" fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="recommended-section" dark>
          <v-card-title>Recommended Albums</v-card-title>
          <v-row>
            <v-col v-for="album in recommendedAlbums" :key="album.pid" cols="12" sm="6" md="4" lg="3">
              <v-card class="album-card" light :to="{ name: 'Album', params: { pid: album.pid } }">
                <v-img v-if="album.coverUrl" :src="album.coverUrl" aspect-ratio="1.7"></v-img>
                <v-card-title class="title">{{ album.name }}</v-card-title>
                <v-card-subtitle>{{ album.author }}</v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <v-spacer class="spacer"></v-spacer>
    <v-row>
      <v-col cols="12">
        <v-card class="recommended-section" dark>
          <v-card-title>Recommended Playlists</v-card-title>
          <v-row>
            <v-col v-for="playlist in recommendedPlaylists" :key="playlist.pid" cols="12" sm="6" md="4" lg="3">
              <v-card class="playlist-card" light :to="{ name: 'Playlist', params: { pid: playlist.pid } }">
                <v-img v-if="playlist.coverUrl" :src="playlist.coverUrl" aspect-ratio="1.7"></v-img>
                <v-card-title class="title">{{ playlist.name }}</v-card-title>
                <v-card-subtitle>{{ playlist.author }}</v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>
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
      albums: [],
      playlists: [],
      recommendedAlbums: [],
      recommendedPlaylists: [],
      coverUrls: {}  
    };
  },
  async mounted() {
    await this.fetchAlbums();
    await this.fetchPlaylists();
  },
  methods: {
    async fetchAlbums() {
      try {
        const response = await apiClient.get('/album-service/album');
        this.albums = response.data.data;
        this.recommendedAlbums = this.getRandomItems(this.albums, 8);
        await this.fetchAlbumCovers();
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    },
    async fetchPlaylists() {
      try {
        const response = await apiClient.get('/playlist-service/playlist');
        this.playlists = response.data.data;
        this.recommendedPlaylists = this.getRandomItems(this.playlists, 8);
        await this.fetchPlaylistCovers();
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    },
    async fetchAlbumCovers() {
      for (let album of this.recommendedAlbums) {
        if (!this.coverUrls[album.pid]) {
          this.coverUrls[album.pid] = await this.getCoverUrl(album.pid);
        }
        this.$set(album, 'coverUrl', this.coverUrls[album.pid]);
      }
    },
    async fetchPlaylistCovers() {
      for (let playlist of this.recommendedPlaylists) {
        if (!this.coverUrls[playlist.pid]) {
          this.coverUrls[playlist.pid] = await this.getCoverUrl(playlist.pid);
        }
        this.$set(playlist, 'coverUrl', this.coverUrls[playlist.pid]);
      }
    },
    getRandomItems(array, num) {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, num);
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
        console.error('Error fetching cover:', error);
        return 'default-cover.jpg';
      }
    },
  }
};
</script>

<style>
.explore-page {
  background-color: #121212;
  padding: 20px;
  padding-bottom:80px;
}

.recommended-section {
  background-color: #808080;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 5px;
  margin-left: 30px;
  margin-right: 30px;
}

.album-card, .playlist-card {
  background-color: white;
}

.spacer {
  height: 40px;
}
.title{
    word-break: break-word;

}
</style>
