var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var taskSchema = new Schema( {
  text: String,
  completed: Boolean,
  dateCreated: Date,
  dateCompleted: Date,
  project: { type: ObjectId, ref: 'Project'}

});

var Task = mongoose.model('Task', taskSchema);

module.exports = Task;
