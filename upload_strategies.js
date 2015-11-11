'use strict';

var fs = require('fs');
var path = require('path');
var bluebird = require('bluebird');
var easyimage = require('easyimage');
var tmp = bluebird.promisifyAll(require('tmp'));
var _ = require('lodash');
var cloudinary = require('cloudinary');
var miss = require('mississippi');
var crayon = require('crayon');

var services = require('./services');
var config = require('./config');

var strategies={
  gridFS: {
    upload: uploadToGridFS,
    url: urlForGridFS
  },
  cloudinary: {
    upload: uploadToCloudinary,
    url: urlForCloudinary
  }
};


function createThumbnail(image, thumbDest, size){
  return easyimage.rescrop({
    src: image.path,
    dst: thumbDest,
    height: size.height,
    width: size.width
  });
}

function processImage(image, strategy){
  console.log(image);
  let allImages=[];
  let imageExtension=path.extname(image.name);
  return new Promise(function(resolve, reject) {
    Promise.all(config.thumbnails.map(size=>{ //get temp names
      return tmp.tmpNameAsync({
        prefix: `./tmp/thumb-${size.name}-`,
        postfix: imageExtension
      });
    })).then(tmpNames=>{ //create thumbnails
      console.log(tmpNames);
      allImages=tmpNames.map((tmpName, index)=>{
        return {
          id: image.id,
          path: image.path,
          name: image.name,
          tmpName,
          size: config.thumbnails[index]
        };
      });
      
      console.log(allImages);
      return Promise.all(allImages.map((item)=>{
        return createThumbnail(item, item.tmpName, item.size);
      }));
    }).then(()=>{ //prepare for upload
      allImages.push(_.merge({}, image, { //also add the original image
        tmpName: image.path,
        size: {name: "full"}
      }));
      return Promise.all(allImages.map(item=>{ //upload
        return strategies[strategy].upload(item, item.size.name);
      }));
    }).then(()=>{
      resolve();
    }).catch(e=>{
      console.log(e.stack);
    });
  });
}

function urlForGridFS(image, size){
  return `/images/serve_mongo/${image.id}/${size}`;
}

function uploadToGridFS(resizedImage, sizeName){
  return new Promise(function(resolve, reject) {
    let readStream=fs.createReadStream(resizedImage.tmpName);

    let writeStream=services.gfs.createWriteStream({
      filename: path.join(resizedImage.id.toString(), sizeName, resizedImage.name)
    });
    
    readStream.pipe(writeStream);
    writeStream.on('finish', ()=>{
      console.log('finished');
      return resolve();
    });
  });
}

function urlForCloudinary(image, size){
  
}

function uploadToCloudinary(resizedImage, sizeName){
  return new Promise(function(resolve, reject) {
    console.log(path.join(resizedImage.id.toString(), sizeName, resizedImage.name));
    cloudinary.uploader.upload(resizedImage.tmpName, result=>{
      console.log("upload finished");
      console.log(result);
      return resolve();
    }, {
      public_id: path.join(resizedImage.id.toString(), sizeName, resizedImage.name)
    });
  });
}

function sendToWorkerQueue(image){
  crayon.error("preparing");
  return new Promise(function(resolve, reject) {
    let readStream=fs.createReadStream(image.path);
    crayon.error("stream");
    console.log(readStream);
    readStream.on('error', err=>{
      crayon.error(err);
    });
    readStream.on("end", ()=>{
      crayon.error("ended");
    });
    let concatStream=miss.concat(data=>{
      crayon.error("enqueuing");
      crayon.error(data);
      crayon.error(data.length);
      let queueId=_.uniqueId("queue_");
      services.monqQueue.enqueue("upload", {
        imageData: data,
        name: image.name,
        id: image.id,
        queueId: queueId
      }, (sent)=>{});
      return resolve(queueId);
    });
    readStream.pipe(concatStream);
  });
}

module.exports = {
  processImage,
  strategies,
  sendToWorkerQueue
};
