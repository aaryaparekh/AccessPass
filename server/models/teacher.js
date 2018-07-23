const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var TeacherSchema = new mongoose.Schema({
  name:{
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
  tokens:[{
    access: {
      type: String,
      require: true
    },
    token:{
      type:String,
      require:true
    }
  }],
  signUpKey:{
    type:String,
    require:false
  }
});

//overide .toJSON method to only send back what we want to send send back
TeacherSchema.methods.toJSON = function(){
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

//generate auth token for Teacher
TeacherSchema.methods.generateAuthToken = function(){
  var user = this;
  var access = 'teacher';
  var token = jwt.sign({_id: user._id.toHexString(), access}, 'someSecretValueToSalt');

  user.tokens = user.tokens.concat([{access, token}]);

  return user.save().then(()=>{
    return token;
  });
};

//logout
TeacherSchema.methods.removeToken = function(tokenArgument){
  var user = this;

  return user.update({
    $pull: {
      tokens:{
        token: tokenArgument
      }
    }
  });
};

//Generate Sign up signUpKey
TeacherSchema.methods.generateSignUpKey = function(){
  var user = this;
  var key = "123456";

  return user.update({
    $push:{
      signUpKey:key
    }
  }).then(()=>{
    return key;
  });

  // return user.save().then(()=>{
  //   return key;
  // });
};

TeacherSchema.statics.findByToken = function(token){
  var User = this;
  var decoded;

  try{
    decoded = jwt.verify(token, 'someSecretValueToSalt');
  }catch(e){
    return Promise.reject();
  }

  return User.findOne({
    _id:decoded._id,
    'tokens.token':token,
    'tokens.access':'teacher'
  });
};

TeacherSchema.statics.findByCredentials = function(email, password){
  var User = this;

  return User.findOne({email}).then((user)=>{
    if(!user){
      return Promise.reject();
    }

    return new Promise((resolve, reject)=>{
      bcrypt.compare(password, user.password, (err, res)=>{
        if(res){
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

TeacherSchema.pre('save', function(next){
  var user = this;

  if(user.isModified('password')){
    bcrypt.genSalt(10, (err, salt)=>{
      bcrypt.hash(user.password, salt, (err, hash)=>{
        user.password = hash;
        next();
      });
    });
  }else{
    next();
  }
});

var Teacher = mongoose.model('Teacher', TeacherSchema);

module.exports = {
  Teacher:Teacher
};
