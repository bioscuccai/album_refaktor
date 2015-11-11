'use strict';

var uploadStrategies=require("./upload_strategies");
var services = require('./services');
var config = require('./config');

var miss = require('mississippi');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var tmp = bluebird.promisifyAll(require('tmp'));
var path = require('path');
var _ = require('lodash');

var worker=services.monqClient.worker(['album']);

function receiveImage(image){
  return new Promise(function(resolve, reject) {
    let tmpName;
    tmp.tmpNameAsync({
      prefix: 'worker-',
      postfix: path.extname(image.name)
    })
    .then(name=>{
      console.log(name);
      fs.writeFileAsync(name, image.imageData.buffer);
      return uploadStrategies.processImage(_.merge({}, image, {path: name}), config.uploadStrategy);
    })
    .then(uploadRes=>{
      resolve();
    });
  });
}

worker.register({
  upload: (image, callback)=>{
    services.mubsubChannel.publish("image_status", {queueId: image.queueId, status: "processing"});
    console.log("received");
    console.log(image);
    receiveImage(image)
    .then(()=>{
      services.mubsubChannel.publish("image_status", {queueId: image.queueId, id: image.id, status: "done"});
      callback(null, null);
    });
  }
});

worker.start();
worker.on("error", err=>{
  console.log(err);
});
