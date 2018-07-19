var {Teacher} = require('./../models/teacher');

var authenticateTeacher = (req, res, next) => {
  var token = req.header('x-auth');

  Teacher.findByToken(token).then((teacher)=>{
    if(!teacher){
      return Promise.reject();
    }

    req.teacher = teacher;
    req.token = token;
    next();
  }).catch((e)=>{
    res.status(401).send();
  });
};

module.exports = {authenticateTeacher};
