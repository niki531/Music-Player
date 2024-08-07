<template>
  <v-app>
    <v-app-bar app color="grey darken-4" dark>
      <v-toolbar-title class="title-left">
        <router-link to="/Explore" class="white--text">Music Player</router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-tabs v-model="tab" background-color="transparent" dark class="center-tabs">
        <v-tab to="/explore">Explore</v-tab>
        <v-tab to="/library">Library</v-tab>
      </v-tabs>
      <v-spacer></v-spacer>
      <v-avatar class="title-right" @click="goToUserPage">
        <span>{{ getUsername }}</span>
      </v-avatar>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
    <audio-player 
      ref="audioPlayer"
      :src="currentTrack.src" 
      :track-title="currentTrack.title" 
      :track-subtitle="currentTrack.subtitle"
      :album-art="currentTrack.albumCover"
      :userId="uid"
      :autoplay=true
      @next-audio="nextTrack" 
      @previous-audio="previousTrack"/>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex';
import apiClient from './services/axios';
import AudioPlayer from './components/AudioPlayer.vue';

export default {
  components: {
    AudioPlayer,
  },
  data() {
    return {
      tab: null,
      currentTrack: {
        src: '',
        title: '',
        subtitle: '',
        track_id: '',
        order: null,
        album_id: null,
        albumCover: '',
        uid: '' ,
      },
      currentPlaylist: [],
      currentTrackIndex: -1,
      playing: false
    };
  },
  computed: {
    ...mapGetters(['getUsername', 'getUserId']),
  },
  methods: {
    goToUserPage() {
      if (this.$route.path !== '/user/me') {
        this.$router.push('/user/me');
      }
    },
    async playTrack(track, playlist, index, albumCover) {
      //console.log('playTrack called with track:', track);
      const updatedTrack = await this.fetchTrackStream(track.tid);
      this.currentTrackIndex = index;
      this.currentTrack = {
        src: updatedTrack.src,
        title: track.title,
        subtitle: track.subtitle,
        autoplay: true,
        track_id: track.tid,
        order: index + 1,
        album_id: this.currentPlaylist.album_id || '',
        albumCover: albumCover
      };
      this.currentPlaylist = playlist;
      this.playing = true;
      this.$nextTick(() => {
        this.$refs.audioPlayer.onPlay();
      });
    },
    nextTrack() {
      console.log('nextTrack called, currentTrack:', this.currentTrack);
      if (this.currentTrackIndex < this.currentPlaylist.length - 1) {
        this.currentTrackIndex++;
        this.updateTrack();
      } else {
        console.log('No next track found.');
      }
    },
    previousTrack() {
      console.log('previousTrack called, currentTrack:', this.currentTrack);
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--;
        this.updateTrack();
      } else {
        console.log('No previous track found.');
      }
    },
    async updateTrack() {
      const track = this.currentPlaylist[this.currentTrackIndex];
      console.log('Updating to track:', track);
      if (!track || !track.tid) {
        console.error('Invalid track or track_id:', track);
        return;
      }
      try {
        const trackResponse = await apiClient.get(`/track-service/track/${track.tid}`);
        const trackData = trackResponse.data.data;
        const updatedTrack = await this.fetchTrackStream(track.tid);
        this.currentTrack = {
          src: updatedTrack.src,
          title: trackData.title,
          subtitle: trackData.artist.join(', '),
          order: track.order,
          track_id: track.tid,
          album_id: track.album_id,
          albumCover: await this.fetchAlbumCover(track.album_id)
        };
        this.playing = true;
        console.log('currentTrack updated to:', this.currentTrack);
      } catch (error) {
        console.error('Error updating track:', error);
      }
    },
    async fetchTrackStream(tid) {
      try {
        const response = await apiClient.get(`/stream-service/stream/${tid}`, { responseType: 'blob' });
        const src = URL.createObjectURL(response.data);
        return { src };
      } catch (error) {
        console.error('Error fetching track stream:', error);
        return { src: '' };
      }
    },
    async fetchAlbumCover(pid) {
      if (!pid) {
        return 'default-album-cover.jpg';
      }
      try {
        const response = await apiClient.get(`/image-service/image/${pid}`, { responseType: 'blob' });
        const coverUrl = URL.createObjectURL(response.data);
        return coverUrl;
      } catch (error) {
        console.error('Error fetching album cover:', error);
        return 'default-album-cover.jpg';
      }
    }
  },
  created() {
    this.$root.$on('play-track', this.playTrack);
    this.uid = this.$store.getters.getUserId;
  },
  beforeDestroy() {
    this.$root.$off('play-track', this.playTrack);
  }
};
</script>

<style>
body {
  background-color: #121212; 
  padding-bottom:120px;
}

.v-application--wrap {
  min-height: 100vh;
  background-color: #121212; 
}

.title-left {
  margin-left: 0;
  flex: 0 0 auto; 
  white-space: nowrap; 
}

.title-right {
  margin-right: 0;
  cursor: pointer;
}

.center-tabs {
  margin: 0 auto;
}

.v-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
}

.v-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white; 
  color: black;
}
</style>
