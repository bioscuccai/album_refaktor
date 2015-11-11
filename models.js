"use strict";

var sha1=require("node-sha1");
var config=require("./config");
var path=require("path");
var Sequelize = require('sequelize');
var bluebird = require('bluebird');

var sequelize=new Sequelize(config.dbPath, {
  pool: {
    maxConnections: 1
  },
  logging: false
});

var Album=function (sequelize, DataTypes) {
  var Album_=sequelize.define('album', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    public: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    views: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: "album",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    instanceMethods:{
      coverPath:
        function(){
          if(this.UploadedImages && this.UploadedImages.length>0){
            return `/images/url/${this.UploadedImages[0].id}/thumb`;
          } else {
            return "/static/images/empty_album.png";
          }
      },
      increaseViews:
        function(callback){
          this.views++;
          this.save(function(){
            if(callback) callback();
          });
        }
    },
    scopes:{
      newest:{
        order: "created_at DESC",
        limit: 4
      },
      mostPopular: {
        order: "views DESC",
        limit: 4
      }
    }
  });
  return Album_;
};

var ImageComment=function (sequelize, DataTypes) {
  var ImageComment_=sequelize.define('image_comment',
  {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    comment_text: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      validate: {
        min: 10,
        max: 4096
      }
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    uploaded_image_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    posted: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "image_comment",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });
  return ImageComment_;
};



var UploadedImage=function (sequelize, DataTypes) {
  return sequelize.define('uploaded_image', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        min: 0,
        max: 4096
      }
    },
    /*img_uuid: {
      type: DataTypes.STRING,
      allowNull: false
    },*/
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploader_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    album_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    views: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 0
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: "uploaded_image",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    instanceMethods:{
      thumbPath:
        function(){
          if(config.uploadStrategy==="local") {
            return "/localfile/thumb/" + this.id;
          }
      },
      fullPath:
        function(){
          if(config.uploadStrategy==="local") {
            return "/localfile/full/" + this.id;
          }
      },
      increaseViews:
      function(callback){
        this.views++;
        this.save().then(function(){
          if(callback) callback();
        }, function(e){
          
        });
      }
    },
    scopes:{
      newest:{
        order: "created_at DESC",
        limit: 4
      },
      mostPopular:{
        order: "views DESC",
        limit: 4
      },
      home:{
        order: "created_at DESC",
        limit: 12
      }
    }
  });
};



var User=function (sequelize, DataTypes) {
  var User_=sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        min: 4,
        max: 32
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate:{
        min: 4,
        max: 256,
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    admin:{
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: "user",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    classMethods: {
      checkCredentials:
      function (email, password) {
          return User_.findOne({where: {email: email, password: sha1(password)}});
        }
        /*
        User_.find({where: {email: email, password: sha1(password)}}).then((user)=>{
          callback(user);
        }, (e)=>{
          return console.log(e);
        });*/
      }
    
  });
  return User_;
};

module.exports = (function (sequelize, DataTypes) {
  let user=User(sequelize, DataTypes);
  let uploadedImage=UploadedImage(sequelize, DataTypes);
  let imageComment=ImageComment(sequelize, DataTypes);
  let album=Album(sequelize, DataTypes);
  
  imageComment.belongsTo(user, {foreignKey: "user_id", as: "User"});
  imageComment.belongsTo(uploadedImage, {foreignKey: "uploaded_image_id", as: "UploadedImage"});
  album.belongsTo(user, {foreignKey: "creator_id", as: "User"});
  uploadedImage.belongsTo(album, {foreignKey: "album_id", as: "Album"});
  uploadedImage.belongsTo(user, {foreignKey: "user_id", as: "User"});
  user.hasMany(imageComment, {as: "ImageComments", foreignKey: "user_id"});
  user.hasMany(album, {as: "Albums", foreignKey: "user_id"});
  user.hasMany(uploadedImage, {as: "UploadedImages", foreignKey: "user_id"});
  uploadedImage.hasMany(imageComment, {as: "ImageComments", foreignKey: "uploaded_image_id"});
  album.hasMany(uploadedImage, {as: "UploadedImages", foreignKey: "album_id"});
  
  return {
    user,
    uploadedImage,
    imageComment,
    album,
    sequelize
  };
})(sequelize, Sequelize);
