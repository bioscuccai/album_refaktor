"use strict";

var express = require('express');
var formidable = require('formidable');
var bluebird = require('bluebird');
var models = require('../models');
var viewForms = require('../view_forms');

var router=express.Router();

router.get("/", (req, res) => {
  models.album.findAll().then(albums => {
    res.render("albums/index", {albums});
  });
});


router.get("/new", (req, res) => {
  res.render("albums/new", {form: viewForms.albumForm});
});

router.get("/:id", (req, res) => {
  models.album.find({where: {id: req.params.id}, include: [{all: true}]}).then(album=>{
    res.render("albums/show", {album});
  });
});

router.post("/", (req, res) => {
  viewForms.albumForm.handle(req, {
    success: form=>{
      models.album.create({
        title: req.body.title,
        user_id: req.user.id,
        public: req.body.public || false
      }).then(model=>{
        return res.redirect(`/albums/${model.id}`);
      });
    },
    error: form=>{
      console.log("error");
      console.log(form);
      res.render("albums/new", {form});
    }
  });
  
});
module.exports = router;