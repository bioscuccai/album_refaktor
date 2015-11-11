'use strict';

var forms=require("forms");
var _ = require('lodash');
var models=require('./models');

//console.log(models.user.attributes);

function minmaxValidator(model, field){
  if(_.get(models, `${model}.attributes.${field}.validate.min`)){
    return [
      forms.validators.minlength(_.get(models, "user.attributes.name.validate.min", 4)),
      forms.validators.minlength(_.get(models, "user.attributes.name.validate.max", 128))
    ];
  } else {
    return [];
  }
}

var loginForm = forms.create({
    email: forms.fields.email({required: true}),
    password: forms.fields.password({required: true})
});

var registerForm=forms.create({
    name: forms.fields.string({
      required: true,
      validators: minmaxValidator('user', 'name')
    }),
    email: forms.fields.email({
      required: true,
      validators: minmaxValidator('user', 'email')
    }),
    password: forms.fields.password({
      required: true,
      validators: [
        forms.validators.minlength(4),
        forms.validators.maxlength(128)
      ]
    }),
    password_confirm: forms.fields.password({
      required: true,
      validators: [
        forms.validators.minlength(4),
        forms.validators.maxlength(128)
      ]
    })
});

var albumForm = forms.create({
    title: forms.fields.string({
      required: true,
      //widget: forms.widgets.textarea(),
      validators: minmaxValidator('album', 'title')
    }),
    public: forms.fields.boolean()
});

var commentForm=forms.create({
    comment_text: forms.fields.string({
      widget: forms.widgets.textarea(),
      required: true,
      validators:  minmaxValidator('image_comment', 'comment_text')
    })
});

var uploadedImageForm=forms.create({
  name: forms.fields.string({
    required: true,
    validators:  minmaxValidator('uploaded_image', 'name')
  }),
  description: forms.fields.string({
    required: true,
    validators:  minmaxValidator('uploaded_image', 'description')
  })
});

module.exports={
    loginForm,
    registerForm,
    albumForm,
    commentForm,
    uploadedImageForm
};