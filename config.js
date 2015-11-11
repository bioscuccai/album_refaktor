module.exports = {
  thumbnails: [
    {
      name: 'thumb',
      height: 150,
      width: 230
    },
    {
      name: 'mid',
      height: 250,
      width: 350
    }
  ],
  redis: {
    host: "localhost",
    port: 6379
  },
  http: {
    host: process.env.VCAP_APP_HOST ||"0.0.0.0",
    port: process.env.VCAP_APP_PORT ||5678
  },
  
  mongo: {
    dbName: "gfs1",
    host: "localhost",
    port: 27017
  },
  mongoUri: "mongodb://localhost:27017/gfs1",


  dbPath: "sqlite://album.db",
  
  directUpload: false,
  uploadStrategy: "gridFS"
};
