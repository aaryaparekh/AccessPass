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
  },
  studentsConfirmed:{
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

//Query for admin
ScheduleSchema.statics.queryDatabase = function(studentID, teacherID, date){
  var schedule =this;
  console.log("Params passed to query: ", studentID, teacherID, date)
  if(studentID && teacherID && date){
    console.log("0");
    return schedule.find({
      students: studentID,
      date: date,
      teacherID: teacherID
    });
  }
  else if(studentID && teacherID && !date){
    console.log("1");
    return schedule.find({
      students: studentID,
      teacherID: teacherID
    });
  }else if(studentID && date && !teacherID){
    console.log("2");
    return schedule.find({
      students: studentID,
      date: date
    });
  }else if(studentID && !date && !teacherID){
    console.log("3");
    return schedule.find({
      students: studentID
    });
  }else if(teacherID && date && !studentID){
    console.log("3");
    return schedule.find({
      teacherID: teacherID,
      date: date
    });
  }else if(teacherID && !date && !studentID){
    console.log("4");
    return schedule.find({
      teacherID: teacherID
    });
  }else if(date && !teacherID && !studentID){
    console.log("5");
    return schedule.find({
      date: date
    });
  }else{
    console.log("error in querying schedule");
    var errorObject = [];
    errorObject.push("No schedules found.")
    return Promise.resolve(errorObject);
  }
}

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
