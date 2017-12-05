var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
  local : {
    username: String,
    password: String
  },

  github : {
    id: String,
    token: String,
    displayName: String,
    username: String,
    profileURL: String,
    email: String
  }
});

//This creates a hashed version of the password for increased security
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

User = mongoose.model('User', userSchema);

module.exports = User;
