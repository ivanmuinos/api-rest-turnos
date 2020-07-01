'use strict'
 
let express = require('express');
let QueueController = require('../controllers/queue');

let api = express.Router();
let md_auth = require('../middlewares/authenticated');

api.post('/saveQueue', md_auth.ensureAuth, QueueController.saveQueue);
api.get('/getQueue', md_auth.ensureAuth, QueueController.getQueue);

module.exports = api;