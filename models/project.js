var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var projectSchema = new Schema( {
  Name: String,
  completed: Boolean,
  dateCreated: Date,
  dateCompleted: Date,
  creator: { type: ObjectId, ref: 'User'}

});

var Project = mongoose.model('Project', projectSchema);

module.exports = Project;
