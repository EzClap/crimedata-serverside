var express = require('express');
var router = express.Router();

var passport = require('passport');
var jwt = require('jsonwebtoken');

//function to authenticate user and return invalid message if unsuccessful
function passportJWT_authenticate(callback) {
    function authResponse(req, res, next) {
        //passport authenticate user to see if there is an error
        passport.authenticate('jwt', function (err, user, info) {
            if (err) { return next(err); }
            //if user authentication fail, return missing authorization header
            if (!user) {
                return res.status(401).send({
                    "error": "oops! it looks like you're missing the authorization header"
                });
            }
            req.user = user;
            return callback(req, res, next);
        })(req, res, next);
    }
    return authResponse;
}


//authenticate user to on reaching router
router.get('/', passportJWT_authenticate(function (req, res, next, err) {

    // write better if statement downbelow
    //building query strings to pass it into SQL via Knex
    let filterArea = "%", filterAge = "", filterSex = "", filterYear = "", filterMonths = "";
    //check to see if offence or query is missing
    if (!req.query.offence || !req.query) {
        res.status(400).send({ "error": "oops! it looks like you're missing the offence query parm" });
    }
    //turn offence query into queriable form
    let offQuery = JSON.stringify(req.query.offence).replace(/\W/g, '');
    //set offence as general query 
    let query = offQuery;
    
    //check to see if there is age query, if yes, turn age query into string
    if (req.query.age !== undefined && req.query.age !== null && req.query.age !== "") {
        filterAge = " and age = " + JSON.stringify(req.query.age);
    }
    //check to see if there is gender query, if yes, turn gender query into string
    if (req.query.gender !== undefined && req.query.gender !== null && req.query.gender !== "") {
        //turn gender into arrays
        let sexArr = req.query.gender.split(',');
        //check to see how many genders are in the query 
        if (!sexArr[1]) {
            filterSex = " and gender = " + JSON.stringify(req.query.gender);
        }
        else if (!sexArr[2]) {
            filterSex = " and (gender = " + JSON.stringify(sexArr[0]) + " or gender = " + JSON.stringify(sexArr[1]) + ")";
        }
        else {
            filterSex = " and (gender = " + JSON.stringify(sexArr[0]) + " or gender = " + JSON.stringify(sexArr[1])
                + " or gender = " + JSON.stringify(sexArr[2]) + ")";
        }
    }
    //check to see if there is area query
    if (req.query.area !== undefined && req.query.area !== null && req.query.area !== "") {
        filterArea = req.query.area;
    }

    //check to see if it's either year or month query or year and month query
    if (!(req.query.year !== undefined && req.query.year !== null && req.query.year !== "") !=
        !(req.query.month !== undefined && req.query.month !== null && req.query.month !== "")) {
        let queryString = "";
        let arr;
        //check if year is queried and not month
        if (req.query.year !== undefined) {
            arr = req.query.year.split(',');
            arr.map((item) => {
                queryString += " when year = " + JSON.stringify(item) + " then " + offQuery;
            })
        }
        //check if month is queried and not year
        else {
            arr = req.query.month.split(',')
            arr.map((item) => {
                queryString += " when month = " + JSON.stringify(item) + " then " + offQuery;
            })
        }
        //update general query 
        query = req.db.raw("case" + queryString + " end")
    }

    //check to see if both year and month are queried
    if ((req.query.year !== undefined && req.query.year !== null && req.query.year !== "") &&
        (req.query.month !== undefined && req.query.month !== null && req.query.month !== "")) {
        let queryString = "";
        let yearArr = req.query.year.split(',');
        let monthArr = req.query.month.split(',');
        
        //year and month query builder when both are queried 
        for (var i = 0; i < yearArr.length; i++) {
            for (var j = 0; j < monthArr.length; j++) {
                queryString += " when month = " + JSON.stringify(monthArr[j])
                    + " and year = " + JSON.stringify(yearArr[i]) + " then " + offQuery;
            }
        }
        //update general query
        query = req.db.raw("case" + queryString + " end");
    }

    //passing query in thru Knex and return appropriate response
    req.db.from('areas').where('area', 'like', filterArea).select('area as LGA', function () {
        this.sum(query).from('offences')
            .whereRaw('offences.area = areas.area' + filterAge + filterSex).as('total')
    }, 'lat', 'lng')
        //return json format of the query
        .then((rows) => {
            res.json({ "query": req.query, "result": rows });
        })
        //catch error
        .catch((err) => {
            res.status(500).send({ "error": "oh no! It looks like there was a database error while performing your search, give it another try...",
                                    "e":{}});
        })
}));


module.exports = router;