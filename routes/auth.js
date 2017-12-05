var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET the authentication page. */
router.get('/', function(req, res, next){
  res.render('authentication');
});

/* GET logout */
router.get('/logout', function(req, res, next){
  req.logout();  // passport provides this
  res.redirect('/');
});

/* POST to login */
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/auth',
  failureFlash: true
}));

/* POST to sign up */
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/auth',
  failureFlash: true //show message
}))

module.exports = router;
