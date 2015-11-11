"use strict";

var express = require('express');
var models = require('../models');

var router=express.Router();

router.get("/", (req, res) => {
  models.uploadedImage.scope("home").findAll().then(newest=>{
    res.render("index", {newest});
  });
});

module.exports = router;