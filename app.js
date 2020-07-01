'use strict'

let express = require('express');
let bodyParser = require('body-parser');
let app = express();

//Aca van a ir las rutas que me traigo para las diferentes peticiones.
let user_routes = require('./routes/user');
let schedule_routes = require('./routes/schedule');
let queue_routes = require('./routes/queue');

//middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

//Aca se cargan las rutas base.
app.use('/api', user_routes);
app.use('/api', schedule_routes);
app.use('/api', queue_routes);

module.exports = app;

