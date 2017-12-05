var express = require('express');
var router = express.Router();
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


/* GET home page with all incomplete tasks */
router.get('/', function(req, res, next) {

  Project.find( { creator: req.user._id, completed: false})
    .then( (docs) => {
      res.render('index', {title: 'Incomplete Tasks', projects: docs})
    })
    .catch( (err) => {
    next(err);
  });

});


/* GET details about one task */

router.get('/project/:_id', function(req, res, next) {

/* This route matches URLs in the format task/anything
Note the format of the route path is  /task/:_id
This matches task/1 and task/2 and task/3...
Whatever is after /task/ will be available to the route as req.params._id
For our app, we expect the URLs to be something like task/1234567890abcdedf1234567890
Where the number is the ObjectId of a task.
So the req.params._id will be the ObjectId of the task to find
*/

  Project.findOne({_id: req.params._id} )
    .then( (project) => {

      if (!project) {
        res.status(404).send('Project not found');
      }
      else if ( req.user._id.equals(project.creator)) {
        // Does this task belong to this user?
        res.render('project', {title: 'Project', project: project});
      }
      else {
        // Not this user's task. Send 403 Forbidden response
        res.status(403).send('This is not your project, you may not view it');
      }
    })
    .catch((err) => {
      next(err);
    })

});


/* GET completed tasks */
router.get('/completed', function(req, res, next){

  Project.find( {creator: req.user._id, completed:true} )
    .then( (docs) => {
      res.render('projects_completed', { title: 'Completed Projects' , projects: docs });
    }).catch( (err) => {
    next(err);
  });

});


/* POST new task */
router.post('/addproject', function(req, res, next){


var date = new Date();

  if (!req.body || !req.body.text) {
    //no task text info, redirect to home page with flash message
    req.flash('error', 'please enter a task');
    res.redirect('/');
  }

  else {

    // Insert into database. New tasks are assumed to be not completed.

    // Create a new Task, an instance of the Task schema, and call save()
    new Task( { creator: req.user._id, text: req.body.text, completed: false, dateCreated: date} ).save()
      .then((newTask) => {
        console.log('The new task created is: ', newTask);
        res.redirect('/');
      })
      .catch((err) => {
        next(err);   // most likely to be a database error.
      });
  }

});


/* POST task done */
router.post('/done', function(req, res, next) {

  var date = new Date();

  Project.findOneAndUpdate( { creator: req.user._id, _id: req.body._id}, {$set: {completed: true, dateCompleted: date}} )
    .then((updatedProject) => {
      if (updatedProject) {   // updatedTask is the document *before* the update
        res.redirect('/')  // One thing was updated. Redirect to home
      } else {
        // if no updatedTask, then no matching document was found to update. 404
        res.status(404).send("Error marking project done: not found");
      }
    }).catch((err) => {
    next(err);
  })

});


/* POST all tasks done */
router.post('/alldone', function(req, res, next) {

  var date = new Date();

  Project.updateMany( { creator: req.user._id, completed : false } , { $set : { completed : true, dateCompleted: date} } )
    .then( (result) => {
      console.log("How many documents were modified? ", result.n);
      req.flash('info', 'All projects marked as done!');
      res.redirect('/');
    })
    .catch( (err) => {
      next(err);
    })

});


/* POST task delete */
router.post('/delete', function(req, res, next){

  Project.deleteOne( { creator: req.user._id, _id : req.body._id } )
    .then( (result) => {

      if (result.deletedCount === 1) {  // one task document deleted
        res.redirect('/');

      } else {
        // The task was not found. Report 404 error.
        res.status(404).send('Error deleting project: not found');
      }
    })
    .catch((err) => {
      next(err);   // Will handle invalid ObjectIDs or DB errors.
    });

});

router.post('/deleteDone', function(req, res, next) {

  Project.deleteMany( {completed: true} )
    .then( (result) => {
      req.flash('info', 'All Completed Projects Deleted');
      res.redirect('/');
    })
    .catch( (err) => {
      next(err);
    })
  });

  router.post('/deleteAll', function(req, res, next) {

    Project.deleteMany( {creator: req.user._id} )
      .then( (result) => {
        req.flash('info', 'All projects deleted');
        res.redirect('/');
      })
      .catch( (err) => {
        next(err);
      })
    });

module.exports = router;
