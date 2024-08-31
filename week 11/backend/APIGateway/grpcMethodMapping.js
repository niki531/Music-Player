export const grpcMethodMapping = {
    'album-service': {
        'album': {
            GET: {
                withoutId: 'GetAlbums',
                withId: 'GetAlbumById'
            },
            DELETE: {
                withId: 'DeleteAlbum'
            }
        }
    },
    'image-service': {
        'image': {
            GET: {
                withId: 'GetAlbumCover'
            },
        }
    },
    'playlist-service': {
        'playlist': {
            GET: {
                withoutId: 'GetPlaylists',  
                withId: 'GetPlaylistById'   
            },
            PUT: {
                withId: 'AddToPlaylist'     
            },
            DELETE: {
                withId: 'DeletePlaylist' 
            }
        },
        'remove-playlist': {
            DELETE: {
                withoutId: 'RemoveTrackFromPlaylist' 
            }
        },
        'myplaylists': {
            GET: {
                withoutId: 'GetUserPlaylists'  
            }
        },
        'create': {
            POST: {
                withoutId: 'CreatePlaylist'  
            }
        }
    },
    'track-service': {
        'track': {
            GET: {
                withoutId: 'GetTracks',
                withId: 'GetTrackById'
            },
            DELETE: {
                withId: 'DeleteTrack'
            }
        }
    },
    'user-library-service': {
        'track-library': {  
            POST: {
                withoutId: 'AddUserLibrary'
            }
        },
        'library-playlist': {  
            DELETE: {
                withId: 'RemovePlaylistFromLibrary'
            }
        },
        'library': { 
            GET: {
                withoutId: 'GetUserLibrary'
            }
        }
    },
    'stream-service': {
        'stream': {  
            GET: {
                withId: 'StreamTrackById'
            }
        }
    },
    'occupation-handler': {
        'user': {  
            POST: {
                withId: 'UpdateUserPlayingStatus'
            },
            GET: {
                withId: 'GetUserPlayingStatus'
            }
        }
    },
    'user-service': {
        'logout': {  
            DELETE: {
                withoutId: 'logoutUser'
            }
        },
        'mypage': {  
            GET: {
                withoutId: 'getUserInfo'
            }
        },
    }
};
