var createError = require('http-errors');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var cors = require('cors');

const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swaggercrime.json');


var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var searchRouter = require('./routes/search');
var authenRouter = require('./routes/authen');
var regRouter = require('./routes/register');
const helmet = require('helmet');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//helmet for security
app.use(helmet());

app.use(logger('common'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());


app.use(passport.initialize());


const options = require('./knexfile.js');
const knex = require('knex')(options);
app.use((req, res, next) => {
  req.db = knex
  next()
})

//different routes
app.use('/login', authenRouter);
app.use('/register',regRouter);
app.use('/search', searchRouter);
app.use('/', indexRouter);
app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerDocument));


logger.token('req', (req, res) => JSON.stringify(req.headers))
logger.token('res', (req, res) => {
 const headers = {}
 res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
 return JSON.stringify(headers)
})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
