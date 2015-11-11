"use strict";

var passport = require('passport');
var LocalStrategy=require("passport-local").Strategy;
var formidable = require('formidable');
var crayon = require('crayon');

var models = require('./models');

function auth(){
  
}

function userSerializer(user, done){
  done(null, user.id);
}

function userDeserializer(userId, done){
  models.user.findById(userId).then(user=>{
    done(null, user);
  });
}

var strategy=new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  (username, password, done)=>{
    models.user.checkCredentials(username, password).then(user=>{
      console.log(user);
      if(user){
        done(null, user);
      } else {
        done(null, false);
      }
    });
  }
);

module.exports = {
  auth,
  strategy,
  userSerializer,
  userDeserializer
};