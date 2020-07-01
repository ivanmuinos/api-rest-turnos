'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_api_rest_turnos';

exports.ensureAuth = function (req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'No se puede procesar la autenticacion'});
    }

    var token = req.headers.authorization.replace(/['"]+/g, '');

    try{
        var payload = jwt.decode(token, secret);

        if(payload.exp <= moment().unix()){
            return res.status(401).send({message: 'La sesion ha expirado'});
        }
    }catch(ex){
        return res.status(404).send({message: 'La sesion no es valida'});
    }

    req.user = payload;

    next();
}