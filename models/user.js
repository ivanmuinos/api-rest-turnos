'use strict'

let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let User = Schema ({
    name: String,
    surname: String,
    password: String,
    email: String,
    mobile: String,
    prepaid: String,
    country: String,
    city: String,
    address: String,
    role: String
});


module.exports = mongoose.model('User', User);