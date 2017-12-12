var express = require('express');
var router = express.Router();
var Project = require('../models/project');
var Task = require('../models/task');
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
      res.render('index', {title: 'Incomplete Projects', projects: docs})
    })
    .catch( (err) => {
    next(err);
  });

});


/* GET details about one project */

router.get('/project/:_id', function(req, res, next) {

/* This route matches URLs in the format task/anything
Note the format of the route path is  /project/:_id
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
        Task.find( {project: req.params._id, completed: false})
        .then( (tasks) => {
          res.render('project', {title: 'Project', project: project, tasks: tasks});
        })
        .catch( (err) => {
        next(err);
      })
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


/* GET completed projects */
router.get('/projects_completed', function(req, res, next){

  Project.find( {creator: req.user._id, completed:true} )
    .then( (docs) => {
      res.render('projects_completed', { title: 'Completed Projects' , projects: docs });
    }).catch( (err) => {
    next(err);
  });

});

/* GET completed tasks */
router.get('/tasks_completed', function(req, res, next){

  Task.find( {completed:true} )
    .then( (tasks) => {
      res.render('tasks_completed', { title: 'Completed Tasks' , tasks: tasks });
    }).catch( (err) => {
    next(err);
  });

});

/* POST new project */
router.post('/addproject', function(req, res, next){


var date = new Date();

  if (!req.body || !req.body.name) {
    //no task text info, redirect to home page with flash message
    req.flash('error', 'please enter a project');
    res.redirect('/');
  }

  else {

    // Insert into database. New projects are assumed to be not completed.

    // Create a new Project, an instance of the Project schema, and call save()
    new Project( { creator: req.user._id, name: req.body.name, completed: false, dateCreated: date} ).save()
      .then((newProject) => {
        console.log('The new project created is: ', newProject);
        res.redirect('/');
      })
      .catch((err) => {
        next(err);   // most likely to be a database error.
      });
  }

});

/* POST project done and tasks within that project*/
router.post('/projectDone', function(req, res, next) {

  var date = new Date();

  Project.findOneAndUpdate( { creator: req.user._id, _id: req.body._id}, {$set: {completed: true, dateCompleted: date}} )
    .then((updatedProject) => {
      if (updatedProject) {
        Task.find({ project: req.body._id }).updateMany({$set: {completed: true, dateCompleted: date}})
          .then((updatedTask) => {
            if (updatedTask){
              res.redirect('/')  // One thing was updated. Redirect to home
          }}).catch((err) => {
          next(err);
        });
      } else {
        // if no updatedTask, then no matching document was found to update. 404
        res.status(404).send("Error marking project done: not found");
      }
    }).catch((err) => {
    next(err);
  })

});

/* POST project and task under it delete */
router.post('/projectDelete', function(req, res, next){

  Project.deleteOne( { creator: req.user._id, _id : req.body._id } )
    .then( (result) => {

      if (result.deletedCount === 1) {  // one task document deleted
        Task.find( {project: req.body._id} ).deleteMany({})
          .then( (results) => {
            res.redirect('/');
          }).catch( (err) => {
            next(err);
          });
      } else {
        // The task was not found. Report 404 error.
        res.status(404).send('Error deleting project: not found');
      }
    })
    .catch((err) => {
      next(err);   // Will handle invalid ObjectIDs or DB errors.
    })

});

router.post('/deleteAll', function(req, res, next) {

  Project.deleteMany( {creator: req.user._id, completed: true} )
    .then( (result) => {
      Task.find( {project: req.body._id} ).deleteMany({})
        .then( (results) => {
          req.flash('info', 'Completed Project Deleted');
          res.redirect('/');
        }).catch( (err) => {
          next(err);
        });
    })
    .catch( (err) => {
      next(err);
    })
  });

  router.post('/deleteAllTasks', function(req, res, next) {

    Task.deleteMany( {completed: true} )
      .then( (result) => {
        req.flash('info', 'Completed Tasks Deleted');
        res.redirect('/');
      }).catch( (err) => {
        next(err);
      })
    });

module.exports = router;
