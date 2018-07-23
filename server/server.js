const express = require('express');
const bodyParser = require('body-parser');
const _=require('lodash');


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
    res.status(400).send(e);
  });
});

//Registering new teacher
app.post('/teachers/registerNew', (req, res)=>{
  var body = _.pick(req.body, ['name', 'email', 'password']);
  var teacher = new Teacher(body);

  teacher.save().then(()=>{
    return teacher.generateAuthToken();
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
  var body = _.pick(req.body, ['teacherID', 'date']);
  var requestData = _.pick(req.body, ['date', 'teacherID', 'studentID']);
  Schedule.findSchedule(requestData.teacherID, requestData.date).then((schedule)=>{
      //DO SCHEDULE.STUDENTS.FIND TO MAKE SURE DUPLICATES AREN'T HAPPENING
       schedule.students.push(requestData.studentID);
       schedule.save().then(()=>{
         res.status(200).send(schedule);
       });
    }, ()=>{
    return new Schedule({
      date: requestData.date,
      teacherID: requestData.teacherID,
      students: [requestData.studentID]
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

app.listen(port, ()=>{
  console.log(`Started server on port ${port}`);
});

module.exports = {app};
