const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var ScheduleSchema = new mongoose.Schema({
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
  students:{
    type:Array
  }

});

//Check to see if document is already made, if made then just add student.
ScheduleSchema.statics.findSchedule = function(someTeacherID, someDate){
  var Schedule = this;

  return Schedule.findOne({
    date: someDate,
    teacherID: someTeacherID
  }).then((schedule) => {
    if (!schedule) {
      return Promise.reject();
    }
    return schedule;
  });
}

var Schedule = mongoose.model('Schedule', ScheduleSchema);

module.exports = {
  Schedule:Schedule
};
