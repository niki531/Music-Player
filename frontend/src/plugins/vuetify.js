import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

const vuetify = new Vuetify({
  theme: {
    themes: {
      dark: {
        primary: '#FFFFFF',
        secondary: '#ff8f00',
        accent: '#8c9eff',
        error: '#b71c1c',
      },
    },
  },
});

export default vuetify;
