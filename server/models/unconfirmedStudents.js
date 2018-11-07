const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment');
moment().format();

var UnconfirmedStudents = new mongoose.Schema({
  date:{
    type:String,
    require:true,
    trim:true,
    minlength:1,
    unique:false
  },
  teacherID:{
    type:String,
    require:true,
    trim:true,
    minlength:1,
    unique:false
  },
  teacherName:{
    type:String,
    require:true,
    trim:true,
    minlength:1,
    unique:false
  },
  students:{
    type:Array
  },
  studentsNames:{
    type:Array
  }

});


var UnconfirmedStudents = mongoose.model('UnconfirmedStudents', UnconfirmedStudents);

module.exports = {
  UnconfirmedStudents:UnconfirmedStudents
};
