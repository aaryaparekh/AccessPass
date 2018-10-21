const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var AdminSchema = new mongoose.Schema({
  firstName:{
    type:String,
    require:true,
    trim:true,
    minlength:1,
    unique:false
  },
  lastName:{
    type:String,
    require:true,
    trim:true,
    minlength:1,
    unique:false
  },
  email:{
    type:String,
    require:true,
    trim:true,
    minlength:1,
    unique:true,
    validate:{
      validator: (value) =>{
        return validator.isEmail(value);
      },
      message: '{VALUE} is not a valid email.'
    }
  },
  password:{
    type:String,
    require: true,
    minlength: 6
  },
  token:{
    type:String,
    require:true
  }
});


//overide .toJSON method to only send back what we want to send send back
AdminSchema.methods.toJSON = function(){
  var admin = this;
  var adminObject = admin.toObject();

  return _.pick(adminObject, ['_id', 'email']);
};

//instance method
//generateAuthToken for admin
AdminSchema.methods.generateAuthToken = function() {
  var admin = this; //Get the individual document
  var newToken = jwt.sign({_id: admin._id.toHexString()}, 'someSecretValueToSalt').toString();

  return admin.update({
      token: newToken
  }).then(()=>{
    return newToken;
  });
};

//loggin in
AdminSchema.statics.findByCredentials = function(email, password){
  var Admin = this;

  return Admin.findOne({email}).then((admin)=>{
    if(!admin){
      return Promise.reject();
    }

    return new Promise((resolve, reject)=>{
      bcrypt.compare(password, admin.password, (err, res)=>{
        if(res){
          resolve(admin);
        } else {
          reject();
        }
      });
    });
  });
};

//Loggout
AdminSchema.methods.removeToken = function(tokenArgument){
  var admin = this;
  return admin.update({
    $unset: {
        token: tokenArgument //pull if on the 'tokens' array there is a 'token' property with the value of the token variable we pass into this function as an argument
    }
  });
};

//Authentication
AdminSchema.statics.findByToken = function(token){
  var Admin = this;
  var decoded;
  try{
    decoded = jwt.verify(token, 'someSecretValueToSalt');
  }catch(e){
    return Promise.reject();
  }
  return Admin.findOne({
    _id: decoded._id,
    token: token  //To query something thats nested, like tokens.token, you need to wrap it in quotes
  });
};


AdminSchema.pre('save', function(next){
  var admin = this;

  if(admin.isModified('password')){
    bcrypt.genSalt(10, (err, salt)=>{
      bcrypt.hash(admin.password, salt, (err, hash)=>{
        admin.password = hash;
        next();
      });
    });
  }else{
    next();
  }
});

var Admin = mongoose.model('Admin', AdminSchema);

module.exports = {
  Admin:Admin
};
