'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_api_rest_turnos';

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname : user.surname,
        email: user.email,
        mobile: user.mobile,
        prepaid: user.prepaid,
        country: user.country,
        city: user.city,
        address: user.address,
        role: user.role,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix

    };

    return jwt.encode(payload, secret);
};