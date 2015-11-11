"use strict";

var express = require('express');
var sequelize = require('sequelize');
var _ = require('lodash');
var cookieParser = require('cookie-parser');
var swig = require('swig');
var flash = require('connect-flash');
var session=require("express-session");
//var RedisStore=require("connect-redis")(session);
var MongoStore=require("connect-mongo")(session);
var ioredis=require("ioredis");
var serveStatic = require('serve-static');
var morgan = require('morgan');
var crayon = require('crayon');
var bluebird = require('bluebird');
var passport = require('passport');
var formidable = require('formidable');

var config = require('./config');
var auth = require('./auth');
var services = require('./services');
var models = require('./models');
var websocket=require("./websocket");

//routes
var albums=require("./routes/albums");
var users=require("./routes/users");
var images=require("./routes/images");
var home=require("./routes/home");
var comments=require("./routes/comments");


var app=express();
var http=require("http").Server(app);
var websocketHandler=websocket(http);

crayon.verbose=true;
app.use(morgan('dev', {
  skip: (req, res) => {
    return req.url.startsWith("/static") || req.url.startsWith("/images/url") || req.url.startsWith("/images/serve_mongo");
  },
  immediate: true
}));
//var ioclient=new ioredis({host: config.redis.host, port: config.redis.port, enableReadyCheck: false});
//app.use(session({secret: "jkjlkjl", store: new RedisStore({client: ioclient}), resave: false, saveUninitialized: false}));
app.use(session({secret: "jkjlkjl", store: new MongoStore({url: config.mongoUri}), resave: false, saveUninitialized: false}));

//instead of bodyparser
app.use((req, res, next)=>{
  let form=new formidable.IncomingForm();
  form.keepExtensions=true; //perserve the extensions
  form.parse(req, (err, fields, files)=>{
    req.body=fields;
    req.files=files;
  });
  form.on('end', ()=>{
    next();
  });
});

app.use(serveStatic(__dirname+"/static"));
app.use(cookieParser("hjlkj"));
app.use(flash());
app.engine("html", swig.renderFile);
app.set("view engine", "html");
app.set("views", "./templates");
app.set("view cache", false);
swig.setDefaults({cache: false});

app.use(passport.initialize());
app.use(passport.session());
passport.use(auth.strategy);
passport.serializeUser(auth.userSerializer);
passport.deserializeUser(auth.userDeserializer);

app.use((req, res, next) => {
  res.locals.currentUser=req.user;
  res.locals.messages=req.flash("info");
  res.locals.errors=req.flash("error");
  Promise.all([
    models.uploadedImage.scope("mostPopular").findAll(),
    models.album.scope("mostPopular").findAll({include: [{all: true}]})
  ]).then(results=>{
    res.locals.mostPopularImages=results[0];
    res.locals.mostPopularAlbums=results[1];
    next();
  });
});

app.use("/", home);
app.use("/albums", albums);
app.use("/users", users);
app.use("/images", images);
app.use("/comments", comments);



http.listen(config.http.port, config.http.host);
