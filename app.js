var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoDBStore = require('connect-mongodb-session')(session);
var passport = require('passport');
var passportConfig = require('./config/passport')(passport);
var hbs = require('hbs');
var helpers = require('./hbshelpers/helpers');

//uses a stored system variable to connect to the database
var db_url = process.env.MONGO_URL33;
mongoose.Promise = global.Promise;
mongoose.connect(db_url, { useMongoClient: true })
  .then( () => { console.log('Connected to MongoDB') } )
  .catch( (err) => {console.log('Error Connecting to MongoDB', err); });

var tasks = require('./routes/tasks');
var projects = require('./routes/projects')
var auth = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper(helpers);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//stores sessions or cookies in the database
var store = MongoDBStore( {uri : db_url, collection: 'sessions'}, function(err){
  if (err) {
    console.log('Error, can\'t conneect to MongoDB to store sessions', err);
  }
});

/*stores cookies with unique ids and in conjunction with passport
stores the user connected to that cookie*/
app.use(session({
  secret: 'replace with long random string',
  resave: true,
  saveUninitialized: true,
  store: store
}));

app.use(passport.initialize());
app.use(passport.session());         // This creates an req.user variable for logged in users.
app.use(flash());

app.use('/auth', auth);
app.use('/', projects);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
