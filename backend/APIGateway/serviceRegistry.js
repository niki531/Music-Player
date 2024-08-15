const services = {
    'album-service': {
        protoPath: './APIGateway/AuthServices/Resource/album-services/album.proto', 
        package: '',
        serviceName: 'AlbumService', 
        address: 'localhost:50052' 
    },
    'image-service': {
        protoPath: './APIGateway/AuthServices/Resource/image-services/image.proto',
        package: '', 
        serviceName: 'ImageService', 
        address: 'localhost:50052' 
    },
    'playlist-service': {
        protoPath: './APIGateway/AuthServices/Resource/playlist-services/playlist.proto',
        package: '', 
        serviceName: 'PlaylistService',
        address: 'localhost:50052' 
    },
    'track-service': {
        protoPath: './APIGateway/AuthServices/Resource/track-services/track.proto', 
        package: '',
        serviceName: 'TrackService',
        address: 'localhost:50052'
    },
    'user-library-service': {
        protoPath: './APIGateway/AuthServices/Resource/user-library-services/library.proto',
        package: '', 
        serviceName: 'UserLibraryService', 
        address: 'localhost:50052'
    },
    'stream-service': {
        protoPath: './APIGateway/AuthServices/Stream/stream-services/stream.proto',
        package: '',
        serviceName: 'StreamService',
        address: 'localhost:50053'
    },
    'occupation-handler': {
        protoPath: './APIGateway/AuthServices/Stream/occupation-handler/occupation.proto',
        package: '', 
        serviceName: 'OccupationHandler', 
        address: 'localhost:50053'
    }
}; 
export default services;