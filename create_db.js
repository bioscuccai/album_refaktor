"use strict";

var models = require('./models');
var config = require('./config');
var bluebird = require('bluebird');
var crayon = require('crayon');
crayon.verbose=true;

bluebird.mapSeries([
  config.dbPath.startsWith("mysql://") ?  models.sequelize.query("SET FOREIGN_KEY_CHECKS = 0") : "",
  models.user.sync({force: true}),
  models.uploadedImage.sync({force: true}),
  models.imageComment.sync({force: true}),
  models.album.sync({force: true}),
  config.dbPath.startsWith("mysql://") ?  models.sequelize.query("SET FOREIGN_KEY_CHECKS = 0") : "",
  //models.sequelize.close()
], item=>{
  return item;
}).then(res => {
  crayon.success("Database successfully initialized");
}, err => {
  crayon.error("Database creation failed");
  crayon.error(err);
  crayon.error(err.stack);
}).catch(ex => {
  crayon.error("Exception during database creation");
  crayon.error(ex);
});