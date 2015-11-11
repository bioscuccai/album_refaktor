'use strict';

var mongodb = require('mongodb');
var gridfsStream = require('gridfs-stream');
var monq = require('monq');
var mubsub = require('mubsub');
var lru = require('lru-cache');

var config = require('./config');

var imageStatus=lru({max: 500});

var monqClient=monq(config.mongoUri);
var monqQueue=monqClient.queue('album');

var mubsubClient=mubsub(config.mongoUri);
var mubsubChannel=mubsubClient.channel('album');

var mongoDb=new mongodb.Db(config.mongo.dbName, new mongodb.Server(config.mongo.host, config.mongo.port));

var gfs=gridfsStream(mongoDb, mongodb);
mongoDb.open((err, db)=>{
  if(config.mongo.username){
    db.authenticate(config.mongo.username, config.mongo.password, err=> {
      console.log(err);
    });
  }
});

module.exports = {
  gfs,
  mongoDb,
  
  monqClient,
  monqQueue,
  
  mubsubClient,
  mubsubChannel,
  
  imageStatus
};
