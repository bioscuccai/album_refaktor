"use strict";

var express = require('express');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var crayon = require('crayon');
var miss = require('mississippi');


var models = require('../models');
var config=require("../config");
var uploadStrategies = require('../upload_strategies');
var viewForms = require('../view_forms');
var services = require('../services');

var router=express.Router();

router.get("/", (req, res) => {
  let start=req.query.start||0;
  models.uploadedImage.findAll().then(images=>{
    res.render("images/index", {images});
  });
});


router.get("/new", (req, res) => {
  res.render("images/new", {album_id: req.query.album});
});

router.get("/:id", (req, res) => {
  let comments;
  models.imageComment.findAll({where: {uploaded_image_id: req.params.id}, include: [{all: true}]})
  .then(dbComments=>{
    comments=dbComments;
    return models.uploadedImage.find({where: {id: parseInt(req.params.id)}, include: [{all: true}]});
  }).then(image=>{
    crayon.info(image.User);
    res.render("images/show", {image, comments, form: viewForms.commentForm});
  });
});

function createImageRecord(req){
  return (()=>{ //check if album exists
    if(!req.query.album){ //no album given -> null
      return Promise.resolve(null);
    }
    let albumId=parseInt(req.query.album)||0;
    return new Promise(function(resolve, reject) { //album exists -> ok; album doesn't exist -> null
      models.album.findById(albumId).then(album=>{
        return resolve(album ? album.id : null);
      });
    });
  })()
  .then(albumId=>{ //creates the image record
    return models.uploadedImage.create(
      {
        user_id: _.get(req, "user.id", null),
        album_id: albumId,
        description: req.body.description,
        provider: config.uploadStrategy,
        name: req.body.name,
        file_name: req.files.image.name
      }
    );
  });
}

router.post("/upload_for_watcher", (req, res) => {
  viewForms.uploadedImageForm.handle(req, {
    success: form=>{
      
      createImageRecord(req)
      .then(model=>{
        let image={
          path: req.files.image.path,
          id: model.id,
          name: req.files.image.name
        };
        crayon.error("send image");
        console.log(image);
        return uploadStrategies.sendToWorkerQueue(image);
      })
      .then((queueId)=>{ //sends feedback
        res.json({queueId: queueId});
      }).catch(err=>{
        console.log(err);
      });
      
      
    },
    error: form=>{
      crayon.error("form error");
      console.log(form);
      console.log(req);
      res.redirect("/images/new");
    }
  });
});

router.post("/", (req, res) => {
  viewForms.uploadedImageForm.handle(req,{
    success: form=>{
      
      
      createImageRecord(req)
      .then(model=>{ //uploads to the provider
        let image={
          path: req.files.image.path,
          id: model.id,
          name: req.files.image.name
        };
        return uploadStrategies.processImage(
          {
            path: req.files.image.path,
            id: model.id,
            name: req.files.image.name
          }, config.uploadStrategy);
      })
      .then(()=>{ //sends feedback
        req.flash("info", "Successfully uploaded");
        res.redirect("/images/new");
      }).catch(err=>{
        console.log(err);
      });
      
      
    },
    error: form=>{
      crayon.error("form error");
      console.log(form);
      res.redirect("/images/new");
    }
  });
  
});

router.get('/url/:id/:size', (req, res) => {
  models.uploadedImage.findById(parseInt(req.params.id)||0).then(image=>{
    if(!image){
      return res.status(500);
    }
    res.redirect(uploadStrategies.strategies[image.provider].url(image, req.params.size));
  });
});

router.get("/serve_mongo/:id/:size", (req, res)=>{
  models.uploadedImage.findById(parseInt(req.params.id)||0).then(image=>{
    if(!image){
      return res.status(404);
    }

    let readStream=services.gfs.createReadStream(path.join(req.params.id, req.params.size, image.file_name));
    readStream.on("error", (e)=>{
      res.status(404);
      res.end();
    });
    readStream.pipe(res);
  });
});

module.exports = router;