const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment');
moment().format();

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

ScheduleSchema.statics.findSchedule = function(someTeacherID, someDate){
  var Schedule = this;

  return Schedule.findOne({
    date: getNextDate(someDate),
    teacherID: someTeacherID
  }).then((schedule) => {
    if (!schedule) {
      return Promise.reject();
    }
    return schedule;
  });
}   

ScheduleSchema.statics.checkIfStudentIsInSchedule = function(someTeacherID, someDate, someStudentID){
  var schedule = this;

  return schedule.findOne({
    date: someDate,
    teacherID: someTeacherID,
    students:someStudentID
  }).then((schedule)=>{
    if(!schedule){
      return Promise.reject();
    }
    return schedule;
  });
};

//Date Generation. Using Moment.js API.
var getNextDate = function(day){ //day being 0 for sunday 6 for saturday
  var date = moment().day(day);
  var formatedDate = date.format("dddd, MMMM Do YYYY");
  return formatedDate;
}

var Schedule = mongoose.model('Schedule', ScheduleSchema);

module.exports = {
  Schedule:Schedule
};
