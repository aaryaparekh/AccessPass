const express = require('express');
const bodyParser = require('body-parser');
const _=require('lodash');
const moment = require('moment');
moment().format();


//import local stuff
//require the mongoose config files
var {mongoose} = require('./db/mongoose.js');
const {ObjectID} = require('mongodb');
//load in models
var {User} = require('./models/user');
var {Teacher} = require('./models/teacher');
var {Schedule} = require('./models/schedules2018-2019');
//middlewear
var {authenticate} = require('./middlewear/authenticate');
var {authenticateTeacher} = require('./middlewear/authenticateTeacher')
//express into variable so we can make changes to it
var app = express();
app.use(bodyParser.json()); //config middlewear for express
app.use(express.static(__dirname+'/htmlFiles')); //config middlewear for express

//variable to hold the port
const port = process.env.PORT || 3000;

//For testing purposes
app.post('/test', (req, res)=>{
  res.status(200).send(getNextDate(4));
});

//Define pages u want to render
app.get('/', (req, res) => {
  res.sendFile(_dirname+'/htmlFiles/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(_dirname+'/htmlFiles/login.html');
});

app.get('/register', (req, res)=>{
  res.sendFile(_dirname+'/htmlFiles/register.html');
});

//Registering new student
app.post('/users/registerNew', (req, res)=>{
  var body = _.pick(req.body, ['name', 'email', 'password']);
  var user = new User(body);

  user.save().then(()=>{
    return user.generateAuthToken();
  }).then((token)=>{
    res.header('x-auth', token).send(user);
  }).catch((e)=>{
    console.log("something didnt go right");
    res.status(400).send(e);
  });
});

//Registering new teacher
app.post('/teachers/registerNew', (req, res)=>{
  var body = _.pick(req.body, ['name', 'email', 'password']);
  var teacher = new Teacher(body);
  console.log("Teacher", teacher);
  teacher.save().then(()=>{
    return teacher.generateAuthToken();
    console.log("Generated token")
  }).then((token)=>{
    res.header('x-auth', token).send(teacher);
  }).catch((e)=>{
    res.status(400).send(e);
  });
});

//Logging in for student
app.post('/users/login', (req, res)=>{
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user)=>{
    return user.generateAuthToken().then((token)=>{
      res.header('x-auth', token).send(user);
    });
  }).catch((e)=>{
    res.status(400).send();
  });
});

//Loggin in for teachers
app.post('/teachers/login', (req, res)=>{
  var body = _.pick(req.body, ['email', 'password']);

  Teacher.findByCredentials(body.email, body.password).then((teacher)=>{
    return teacher.generateAuthToken().then((token)=>{
      res.header('x-auth', token).send(teacher);
    });
  }).catch((e)=>{
    res.status(400).send();
  });
});

//Logging out for students
app.delete('/users/logOut', authenticate, (req, res)=>{
  req.user.removeToken(req.token).then(()=>{
    res.status(200).send();
  }, ()=>{
    res.status(400).send();
  });
});

//loggin out for Teacher
app.delete('/teachers/logOut', authenticateTeacher, (req, res)=>{
  req.teacher.removeToken(req.token).then(()=>{
    res.status(200).send();
  }, ()=>{
    res.status(400).send();
  });
});

//generate signUpKey for Teachers
app.post('/teachers/generateSignUpToken', authenticateTeacher, (req, res)=>{
  req.teacher.generateSignUpKey().then((key)=>{
    res.status(200).send(key);
  }, ()=>{
    res.status(400).send();
  });
});

//add student to schedules2018-2019
app.post('/schedule/addStudent', authenticate, (req, res)=>{
  var requestData = _.pick(req.body, ['teacherID']);
  Schedule.findSchedule(requestData.teacherID, requestData.date).then((schedule)=>{
      //DO SCHEDULE.STUDENTS.FIND TO MAKE SURE DUPLICATES AREN'T HAPPENING
      if(schedule.students.length){
        index = schedule.students.indexOf(req.user._id);
        if(index == -1)
          schedule.students.push(req.user._id);
      } else {
        schedule.students.push(req.user._id);
      }
      schedule.save().then(()=>{
         res.status(200).send(schedule);
       });
    }, ()=>{
    return new Schedule({
      date: getNextDate(3),                    //CHANGE THIS TO ADD DATE BASED ON WHAT USER SELECTS
      teacherID: requestData.teacherID,
      students: [req.user._id]
    }).save().then((schedule)=>{
      res.status(200).send(schedule);
    });

    res.status(400).send();
  });

});

//Add teacher with email
app.post('/users/addTeacher', authenticate, (req, res)=>{
  var body = _.pick(req.body, ['teacherEmail']);
  req.user.addTeacher(body.teacherEmail).then((savedUser)=>{
    res.status(200).send(savedUser);
  }, ()=>{
    res.status(400).send();
  });
});

//Date Generation. Using Moment.js API.
var getNextDate = function(day){ //day being 0 for sunday 6 for saturday
  var date = moment().day(day);
  var formatedDate = date.format("dddd, MMMM Do YYYY");
  return formatedDate;
}

app.listen(port, ()=>{
  console.log(`Started server on port ${port}`);
});

module.exports = {app};
