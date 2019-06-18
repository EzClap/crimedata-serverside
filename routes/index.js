var express = require('express');
var router = express.Router();
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('../docs/swaggercrime.json');


//all open APIs for user to check different search filters
router.get("/offences",
  function (req, res, next) {
    //query mysql server to retrieve offences data and json send
    req.db.from('offence_columns').select("pretty").pluck('pretty')
      .then((rows) => {
        res.json({ "offences": rows })
      })
      //catch error
      .catch((err) => {
        console.log(err);
        res.json({ "Error": true, "Message": "Error in MySQL query" })
      })
  }
);


router.get("/areas", function (req, res, next) {
  //query mysql server to retrieve areas data and json send
  req.db.from('offences').distinct("area").pluck('area')
    .then((rows) => {
      res.json({ "areas": rows })
    })
    //catch err
    .catch((err) => {
      console.log(err);
      res.json({ "Error": true, "Message": "Error in MySQL query" })
    })
});

router.get("/ages", function (req, res, next) {
  //query mysql server to retrieve age data and json send
  req.db.from('offences').distinct("age").pluck('age')
    .then((rows) => {
      res.json({ "ages": rows })
    })
    //catch error
    .catch((err) => {
      console.log(err);
      res.json({ "Error": true, "Message": "Error in MySQL query" })
    })
});

router.get("/genders", function (req, res, next) {
  //query mysql server to retrieve gender data and json send
  req.db.from('offences').distinct("gender").pluck('gender')
    .then((rows) => {
      res.json({ "genders": rows })
    })
    //catch error
    .catch((err) => {
      console.log(err);
      res.json({ "Error": true, "Message": "Error in MySQL query" })
    })
});

router.get("/years", function (req, res, next) {
  //query mysql server to retrieve year data and json send
  req.db.from('offences').distinct("year").pluck('year')
    .then((rows) => {
      res.json({ "years": rows })
    })
    //catch error
    .catch((err) => {
      console.log(err);
      res.json({ "Error": true, "Message": "Error in MySQL query" })
    })
});

//default link to swagger UI 
router.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

module.exports = router;
