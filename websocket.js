'use strict';


var _ = require('lodash');
var crayon = require('crayon');

var services = require('./services');

let imageSockets=[];

services.mubsubChannel.subscribe("image_status", (status)=>{
  console.log("pubsub");
  console.log(status);
  services.imageStatus.set(status.queueId, status);
  sendStatus(status.queueId);
  
});

function sendStatus(queueId){
  let currentSocket=_.find(imageSockets, {queueId});
  console.log(currentSocket);
  if(currentSocket){
    currentSocket.socket.emit("status_update", services.imageStatus.get(queueId)||{queueId: queueId, status: "in_queue"});
  }
}

module.exports = (http)=>{
  var io = require('socket.io')(http);
  io.on("connect", (socket)=>{
    console.log("connect");
    socket.on("image_subscribe", (queueId)=>{
      imageSockets.push({
        socket: socket,
        queueId: queueId
      });
      console.log(queueId);
      crayon.error("subscribe");
    });
  });
};
