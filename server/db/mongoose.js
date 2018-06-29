//config file for moongoose
const mongoose = require('mongoose');

//tell mongoose to use promises
mongoose.Promise = global.Promise;

//connect
//This part checks if mongodb should use the HEROKU mongodb extension if its is there
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AccessPass');

//export
module.exports = {
  mongoose: mongoose
};
