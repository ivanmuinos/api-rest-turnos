'use strict'
 
let express = require('express');
let UserController = require('../controllers/user');

let api = express.Router();
let md_auth = require('../middlewares/authenticated');

api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/user', UserController.getUsers);
api.post('/user', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.put('/user/:id', UserController.updateUser);
api.delete('/user/:id', md_auth.ensureAuth, UserController.deleteUser);

module.exports = api;