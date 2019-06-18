var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const bookshelf = require('bookshelf');
const options = require('../knexfile.js');
const knex = require('knex');
const db = bookshelf(knex(options));
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

//setting querying table in bookshelf for users
const User = db.Model.extend({
    tableName: 'users',
    hasTimestamps: true
});

//option to set AuthHeaderAsBearerToken as the strategy 
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET
}

//create a new strategy to retrieve the user id for checking 
const strategy = new jwtStrategy(opts, (payload, next) => {

    User.forge({ id: payload.id }).fetch().then((res) => {
        next(null, res);
    });
});

//use the new strategy 
passport.use(strategy);

    //restructure returns
    //authenticate user on login with different result
    router.post('/', (req, res) => {
        if (!req.body.email || !req.body.password) {
            return res.status(401).send({ "message": "invalid login - you need to supply both an email and password" });
        }
        //query database with input email
        User.forge({ email: req.body.email }).fetch().then((result) => {
            if (!result) {
                return res.status(401).send({ "message": "oh no! It looks like that user doesn't exist..." });
            }
            //compare the hash stored in the database
            bcrypt.compare(req.body.password, result.get('password'), function (err, user) {
                //catch error, return message to user
                if (err) {
                    return res.status(400).send({ "error": "error trying to log in" });
                }
                //payload is id in the db
                if (user) {
                    const expiresIn = 24 * 60 * 60;
                    const payload = { id: result.get('id') };
                    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: expiresIn })
                    
                    //sending token
                    res.status(200).send({ 'token': token, 'access_token': token, 'token_type': 'Bearer', 'expires_in': expiresIn });
                } else {
                    res.status(401).send({"message": "invalid login - bad password"});
                }
            });
        });
    });

    module.exports = router;