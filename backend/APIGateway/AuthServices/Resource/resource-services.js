import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import albumRoutes from './album-services/albumRoutes.js';
import playlistRoutes from './playlist-services/playlistRoutes.js';
import imageRoutes from './image-services/imageRoutes.js';
import userLibraryRoutes from './user-library-services/libraryRoutes.js';
import trackRoutes from './track-service/trackRoutes.js';
import axios from 'axios';

const app = new Koa();
app.use(bodyParser());

app.use(albumRoutes.routes()).use(albumRoutes.allowedMethods());
app.use(playlistRoutes.routes()).use(playlistRoutes.allowedMethods());
app.use(imageRoutes.routes()).use(imageRoutes.allowedMethods());
app.use(userLibraryRoutes.routes()).use(userLibraryRoutes.allowedMethods());
app.use(trackRoutes.routes()).use(trackRoutes.allowedMethods());

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Service running on http://localhost:${PORT}`);

    // Register Album Service
    axios.post('http://localhost:3000/register', {
        name: "album-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "album", method: ["get", "delete"] }
        ]
    }).then(() => {
        console.log('Album service registered.');
    }).catch(err => {
        console.error('Failed to register album service:', err);
    });

    // Register Playlist Service
    axios.post('http://localhost:3000/register', {
        name: "playlist-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "playlist", method: ["get", "put", "post", "delete"] }
        ]
    }).then(() => {
        console.log('Playlist service registered.');
    }).catch(err => {
        console.error('Failed to register playlist service:', err);
    });

    // Register Image Service
    axios.post('http://localhost:3000/register', {
        name: "image-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "image", method: ["get"] }
        ]
    }).then(() => {
        console.log('Image service registered.');
    }).catch(err => {
        console.error('Failed to register image service:', err);
    });

    // Register User Library Service
    axios.post('http://localhost:3000/register', {
        name: "user-library-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "user-library-service", method: ["get", "post", "delete"] }
        ]
    }).then(() => {
        console.log('User Library service registered.');
    }).catch(err => {
        console.error('Failed to register user library service:', err);
    });

    // Register Track Service
    axios.post('http://localhost:3000/register', {
        name: "track-service",
        url: `http://localhost:${PORT}`,
        auth: true,
        type: "REST",
        listen: [
            { name: "track", method: ["get", "delete"] }
        ]
    }).then(() => {
        console.log('Track service registered.');
    }).catch(err => {
        console.error('Failed to register track service:', err);
    });
});
