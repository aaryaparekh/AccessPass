const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var {Teacher} = require('./teacher');

var UserSchema = new mongoose.Schema({
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
  },
  teachers:{
    type:Array
  }
});

//overide .toJSON method to only send back what we want to send send back
UserSchema.methods.toJSON = function(){
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

//instance method
//generateAuthToken for student
UserSchema.methods.generateAuthToken = function() {
  var user = this; //Get the individual document
  var access = 'auth';
  var newToken = jwt.sign({_id: user._id.toHexString(), access}, 'someSecretValueToSalt').toString();

  return user.update({

      token: newToken,
      access: access

  }).then(()=>{
    return newToken;
  });
};

//Loggout
UserSchema.methods.removeToken = function(tokenArgument){
  var user = this;
  return user.update({
    $unset: {
        token: tokenArgument //pull if on the 'tokens' array there is a 'token' property with the value of the token variable we pass into this function as an argument
    }
  });
};

//Add teacher, takes in teacher email, adds teacher ID to student doc
UserSchema.methods.addTeacher = function(teacherEmail){
  var user = this;
  var found = -10;
  return Teacher.findOne({
    email:teacherEmail
  }).then((teacher)=>{
    if(!teacher){
      return Promise.reject();
    }
    if (user.teachers.length) {
      found = user.teachers.indexOf(teacher._id);
      if(found == -1)
        user.teachers.push(teacher._id);

    } else {
      user.teachers.push(teacher._id);
    }

    return user.save().then((savedUser)=>{
      return savedUser;
    });
  });
};

//Get all teacher ID's from student doc
UserSchema.methods.getTeachers = function(){
  var user = this;
  return user.teachers;
};

UserSchema.statics.findByToken = function(token){
  var User = this; //Get the user model itself
  var decoded;

//Check to see if jwt.verify works, if it does then set decoded = to jwt.verify. If it doesn't work then catch the error.
  try{
    decoded = jwt.verify(token, 'someSecretValueToSalt'); //decode the token, which has the _id property to it.
  }catch(e){
    return Promise.reject(); //Same thing as returning a new promise, and then rejecting it.
  }

//Student findOne
//Query the database, return the document that is found with the give query or return none if there are none.
  return User.findOne({
    _id: decoded._id,
    token: token,  //To query something thats nested, like tokens.token, you need to wrap it in quotes
  });
};

UserSchema.statics.findByCredentials = function(email, password){
  var User = this;

//first query the email using .findOne() to find a document with the same email.
  return User.findOne({email:email}).then((user) => {
    if(!user){
      console.log("no user found");
      return Promise.reject(); //run the catch call wherever this method is called
    }

    return new Promise((resolve, reject)=>{ //bcrypt uses callbacks, not promises. So we need to make our own promise and call bcrypt inside. Then reject or resolve the promise based on what we want.
      bcrypt.compare(password, user.password,(err, res)=>{
        console.log("entering compare command in user.js");
        if(res){
          resolve(user);    //If res is true, passwords match, and so send back the user we found
        } else {
          reject();
        }
      });
    });
  });
};

//middlewear for models and schemas, runs right before model is saved
UserSchema.pre('save', function(next){
  var user = this; //user = an individual User document. So when a user doc is saved, this code will run on that user doc.

  if(user.isModified('password')){ //checks if the password variable in the doc has ever been modified, if true then run our code.
    bcrypt.genSalt(10, (err, salt)=>{
      bcrypt.hash(user.password, salt, (err, hash)=>{
        user.password = hash;
        next();
      });
    });
  } else {
    //password hasn't been modified, that means it is already hashed and we dont have to do anything
    next();
  }
});

//export
var User = mongoose.model('User', UserSchema);

 module.exports = {
   User:User
 };
