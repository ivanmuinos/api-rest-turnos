'use strict'
 
let express = require('express');
let ScheduleController = require('../controllers/schedule');

let api = express.Router();
let md_auth = require('../middlewares/authenticated');

api.get('/getScheduleByUser', md_auth.ensureAuth, ScheduleController.getScheduleByUser);
api.get('/getTodayScheduleByDoctor', md_auth.ensureAuth, ScheduleController.getTodayScheduleByDoctor);
api.get('/getScheduleByDate/:startDate/:endDate/:typeUser', md_auth.ensureAuth, ScheduleController.getScheduleByDate);
api.get('/getSchedules/:speciality/:startDate/:startTime/:endTime/:profesional?', md_auth.ensureAuth, ScheduleController.getSchedules);
api.get('/getNextAvailableSchedule/:speciality/:profesional?', md_auth.ensureAuth, ScheduleController.getNextAvailableSchedule);

api.post('/saveScheduleByDoctor', md_auth.ensureAuth, ScheduleController.saveScheduleByDoctor);
api.post('/saveScheduleBySanatorio', md_auth.ensureAuth, ScheduleController.saveScheduleBySanatorio);

api.put('/saveScheduleByUser', md_auth.ensureAuth, ScheduleController.saveScheduleByUser);
api.put('/confirmScheduleByUser', md_auth.ensureAuth, ScheduleController.confirmScheduleByUser);
api.put('/cancelSingleSchedule', md_auth.ensureAuth, ScheduleController.cancelSingleSchedule);
api.put('/cancelSelectedSchedule', md_auth.ensureAuth, ScheduleController.cancelSelectedSchedule);


module.exports = api;