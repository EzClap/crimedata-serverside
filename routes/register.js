var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const bookshelf = require('bookshelf');
const options = require('../knexfile.js');
const knex = require('knex');
const db = bookshelf(knex(options));
const bcrypt = require('bcrypt');
const saltRounds = 10;


//setting querying table in bookshelf for users
const User = db.Model.extend({
    tableName: 'users',
    hasTimestamps: true
});
//registering user
router.post('/', (req, res) => {

    //add email format restriction
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ "message": "error creating new user - you need to supply both an email and password" });
    }

    //use sync hash?
    //hashing user input and implement salt
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

        // Store hash in your password DB.
        const user = new User({
            email: req.body.email,
            password: hash
        });
        //create user in the database via bookshelf middleware
        user.save(null, { method: 'insert' }).then(() => {
            res.status(201).send({ "message": "yay! you've successfully registered your user account :)" });
        }).catch((err) => {
            console.log(err.code);
            //catch error, if user exists, return user exists error message
            if (err.code === "ER_DUP_ENTRY") {
                res.status(400).send({ "message": "oops! It looks like that user already exists :(" })
            }else{
                res.status(400).send({"message": "Insert failed - other issues"})
            }
        });
    });
});

module.exports = router;