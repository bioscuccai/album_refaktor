"use strict";

var express = require('express');
var formidable = require('formidable');
var bluebird = require('bluebird');
var sha1=require("node-sha1");
var crayon = require('crayon');
var passport = require('passport');

var models = require('../models');
var viewForms = require('../view_forms');

var router=express.Router();

router.get("/login", (req, res) => {
  console.log(req.flash());
  res.render("users/login");
});

router.post("/login", passport.authenticate('local',  {failureRedirect: "/", failureFlash: "Invalid login"}), (req, res) => {
//router.post("/login",  (req, res) => {
  res.redirect("/users/login");
});

router.get("/register", (req, res) => {
  res.render("users/register");
});

router.post("/register", (req, res) => {
  viewForms.registerForm.handle(req, {
    success: form => {
      models.user.create({name: req.body.name, email: req.body.email, password: sha1(req.body.password)})
      .then(model=>{
        req.flash("info", "User successfully created");
        res.redirect("/users/login");
      }, error=>{
        console.log(error);
        req.flash("error", "Error during registration");
        res.redirect("/users/register");
      });
    },
    error: form => {
      res.redirect("/users/register");
    },
    
  });
  
});

router.get("/logout", (req, res)=>{
    console.log("loggin out");
    req.logout();
    console.log("logged out");
    //req.flash("info", "Logged out.");
    res.redirect("/");
});

module.exports = router;