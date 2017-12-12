var express = require('express');
var router = express.Router();
var Task = require('../models/task');
var Project = require('../models/project');
var ObjectId = require('mongoose').mongo.ObjectID;


/* Middleware, to verify if the user is authenticated */
function isLoggedIn(req, res, next) {
  console.log('user is auth ', req.user)
  if (req.isAuthenticated()) {
    res.locals.username = req.user.local.username;
    next();
  } else {
    res.redirect('/auth');
  }
}

/* Apply this middleware to every route in the file, so don't need to
specify it for every router */

router.use(isLoggedIn);

router.get('/:_id/task/:_id', function(req, res, next) {

/* This route matches URLs in the format task/anything
Note the format of the route path is  /task/:_id
This matches task/1 and task/2 and task/3...
Whatever is after /task/ will be available to the route as req.params._id
For our app, we expect the URLs to be something like task/1234567890abcdedf1234567890
Where the number is the ObjectId of a task.
So the req.params._id will be the ObjectId of the task to find
*/

  Task.findOne({_id: req.params._id} )
    .then( (task) => {
        res.render('task', {title: 'Task', task: task});
    })
    .catch((err) => {
      next(err);
    })

});

/* POST new task */
router.post('/:_id/add', function(req, res, next){


var date = new Date();

  if (!req.body || !req.body.text) {
    //no task text info, redirect to home page with flash message
    req.flash('error', 'please enter a task');
    res.redirect('/project/'+req.params._id);
  }

  else {

    // Insert into database. New tasks are assumed to be not completed.

    // Create a new Task, an instance of the Task schema, and call save()
    new Task( { project: req.params._id, text: req.body.text, completed: false, dateCreated: date} ).save()
      .then((newTask) => {
        console.log('The new task created is: ', newTask);
        res.redirect('/project/'+ req.params._id);
      })
      .catch((err) => {
        next(err);   // most likely to be a database error.
      });
  }

});


/* POST task done */
router.post('/:_id/done', function(req, res, next) {

  var date = new Date();

  Task.findOneAndUpdate( {project: req.params._id, _id: req.body._id}, {$set: {completed: true, dateCompleted: date}} )
    .then((updatedTask) => {
      if (updatedTask) {   // updatedTask is the document *before* the update
        res.redirect('/project/'+req.params._id);  // One thing was updated. Redirect to home
      } else {
        // if no updatedTask, then no matching document was found to update. 404
        res.status(404).send("Error marking task done: not found");
      }
    }).catch((err) => {
    next(err);
  })

});


/* POST all tasks done */
router.post('/:_id/alldone', function(req, res, next) {

  var date = new Date();

  Task.updateMany( { project: req.params._id, completed : false } , { $set : { completed : true, dateCompleted: date} } )
    .then( (result) => {
      console.log("How many documents were modified? ", result.n);
      req.flash('info', 'All tasks marked as done!');
      res.redirect('/project/'+req.params._id);
    })
    .catch( (err) => {
      next(err);
    })

});


/* POST task delete */
router.post('/:_id/delete', function(req, res, next){

  Task.deleteOne( {project: req.params._id, _id : req.body._id } )
    .then( (result) => {

      if (result.deletedCount === 1) {  // one task document deleted
        res.redirect('/project/'+req.params._id);

      } else {
        // The task was not found. Report 404 error.
        res.status(404).send('Error deleting task: not found');
      }
    })
    .catch((err) => {
      next(err);   // Will handle invalid ObjectIDs or DB errors.
    });

});

router.post('/deleteDone', function(req, res, next) {

  Task.deleteMany( {completed: true} )
    .then( (result) => {
      req.flash('info', 'All Completed Tasks Deleted');
      res.redirect('/project');
    })
    .catch( (err) => {
      next(err);
    })
  });

  router.post('/deleteAll', function(req, res, next) {

    Task.deleteMany( {project: req.project._id} )
      .then( (result) => {
        req.flash('info', 'Tasks Deleted');
        res.redirect('/project');
      })
      .catch( (err) => {
        next(err);
      })
    });

module.exports = router;
