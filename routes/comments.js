"use strict";

var express = require('express');
var models = require('../models');
var _ = require('lodash');


var router=express.Router();

router.post("/:imageId", (req, res) => {
  models.imageComment.create({
    user_id: _.get(req, "user.id", null),
    comment_text: req.body.comment_text,
    uploaded_image_id: parseInt(req.params.imageId)
  }).then(comment=>{
    res.redirect(`/images/${req.params.imageId}`);
  });
});

module.exports = router;