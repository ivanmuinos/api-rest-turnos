let Schedule = require('../models/schedule');
let User = require('../models/user');

let moment = require('moment');
let mongoosePaginate = require('mongoose-pagination');
let bcrypt = require('bcrypt-nodejs');
let jwt = require('../services/jwt');

function saveScheduleByDoctor(req, res) {
	let schedule = new Schedule();
	let params = req.body;
	let doctorId = req.user.sub;

	let date_two_months = moment(params.dateStart).add(2, 'M').format('YYYY-MM-DD');

	//if (moment(params.dateEnd).isAfter(date_two_months)) return res.status(500).send({ message: 'Fecha no permitida' });

	schedule.doctor = doctorId;
	schedule.speciality = params.speciality;
	schedule.date = params.dateStart;
	schedule.time = moment(params.timeStart, 'HH:mm').format("HH:mm");
	schedule.state = "Disponible";

	let a = moment(params.dateEnd, 'YYYY-MM-DD');
	let b = moment(schedule.date, 'YYYY-MM-DD');

	let c = moment(params.timeEnd, 'HH:mm');
	let d = moment(params.timeStart, 'HH:mm');

	let diffDays = moment.duration(a.diff(b)).asDays();
	let diffTime = moment.duration(c.diff(d)).asMinutes();

	let calc = parseInt(diffTime) / parseInt(30);

	let document = [];

	for (var i = 0; i < diffDays + 1; i++) {
		let calcDate = moment(schedule.date, 'YYYY-MM-DD').add(i, 'days').format('YYYY-MM-DD');
		let calcTime = schedule.time;
		for (var j = 0; j < calc; j++) {
			document.push({
				"doctor": schedule.doctor,
				"speciality": schedule.speciality,
				"date": calcDate,
				"time": calcTime,
				"state": schedule.state
			})
			calcTime = moment(calcTime, 'HH:mm').add(params.duration, 'minutes').format('HH:mm');
		}
	}

	Schedule.findOne({doctor: doctorId, date: {$gte: params.dateStart, $lte: params.dateEnd}}).exec((err, schedule) => {
		if (err) return res.status(500).send('Error agendar el turno');
		if (!schedule) {
			Schedule.insertMany(document, (err, mongooseDocuments) => {
				if (err) return res.status(500).send('Error agendar el turno');
				if (!mongooseDocuments) return res.status(404).send('No se pudo agendar el turno');
				return res.status(200).send({ schedule: mongooseDocuments });
			});
		}else{
			console.log(params.speciality);
			Schedule.findOne({doctor: doctorId, speciality: params.speciality, date: {$gte: params.dateStart, $lte: params.dateEnd}}).exec((err, schedule) => {
				if (err) return res.status(500).send('Error agendar el turno');
				if (!schedule){
					return res.status(500).send('Error agendar el turno');
				}else{
					Schedule.insertMany(document, (err, mongooseDocuments) => {
						if (err) return res.status(500).send('Error agendar el turno');
						if (!mongooseDocuments) return res.status(404).send('No se pudo agendar el turno');
						return res.status(200).send({ schedule: mongooseDocuments });
					});
				}
			});
		}
	});

	
}

function saveScheduleByUser(req, res) {
	let userId = req.user.sub;
	let params = req.body;

	let scheduleId = params.schedule;
	let speciality = params.speciality;
	let date = params.date;
	let time = params.time;


	//Checkeo que no tenga un turno para la especialidad el mismo dia
	Schedule.findOne({ patient: userId, speciality: speciality, date: date }).exec((err, schedule) => {
		if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
		if (!schedule) {
			//Checkeo que no tenga un turno en ese horario para que no se superpongan.
			Schedule.findOne({ patient: userId, date: date, time: time }).exec((err, schedule) => {
				if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
				if (!schedule) {
					Schedule.findByIdAndUpdate(scheduleId, { patient: userId, state: "Reservado" }, { new: true }, (err, scheduleUpdated) => {
						if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
						if (!scheduleUpdated) return res.status(404).send({ message: 'No se pudo solicitar el turno' });
						return res.status(200).send({ schedule: scheduleUpdated });
					})
				} else {
					return res.status(404).send('Error al solicitar el turno');
				}
			});

		} else {
			return res.status(404).send('Error al solicitar el turno');
		}

	});

	/* 	Schedule.findByIdAndUpdate(scheduleId, { patient: userId, state: "Reservado" }, { new: true }, (err, scheduleUpdated) => {
			if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
			if (!scheduleUpdated) return res.status(404).send({ message: 'No se pudo solicitar el turno' });
			return res.status(200).send({ schedule: scheduleUpdated });
		}) */
}
function saveScheduleBySanatorio(req, res) {
	let params = req.body;

	let scheduleId = params.schedule;
	let speciality = params.speciality;
	let date = params.date;
	let time = params.time;
	let patientEmail = params.patient;

	console.log(scheduleId);
	console.log(speciality);
	console.log(date);
	console.log(time);
	console.log(patientEmail);

	//Busco el id del usuario 
	User.find({email: patientEmail}).exec((err, user) => {
		if (err) return res.status(500).send({ message: 'Error al busca el email' });
		if (!user) return res.status(404).send('El email no existe');

		let userId = user[0]._id;
		let typeUser = user[0].role;
		
		//Checkeo que no sea un doctor
		if(typeUser === 'doctor'){
			return res.status(404).send('Error al solicitar el turno');
		}else{
			//Checkeo que no tenga un turno para la especialidad el mismo dia
			Schedule.findOne({ patient: userId, speciality: speciality, date: date }).exec((err, schedule) => {
				if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
				if (!schedule) {
					//Checkeo que no tenga un turno en ese horario para que no se superpongan.
					Schedule.findOne({ patient: userId, date: date, time: time }).exec((err, schedule) => {
						if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
						if (!schedule) {
							Schedule.findByIdAndUpdate(scheduleId, { patient: userId, state: "Reservado" }, { new: true }, (err, scheduleUpdated) => {
								if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
								if (!scheduleUpdated) return res.status(404).send({ message: 'No se pudo solicitar el turno' });
								return res.status(200).send({ schedule: scheduleUpdated });
							})
						} else {
							return res.status(404).send('Error al solicitar el turno');
						}
					});

				} else {
					return res.status(404).send('Error al solicitar el turno');
				}

			});
		}
		

	});
}

function confirmScheduleByUser(req, res) {

	let userId = req.user.sub;
	let scheduleId = req.body.schedule;

	Schedule.findByIdAndUpdate(scheduleId, { patient: userId, state: "Confirmado" }, { new: true }, (err, scheduleUpdated) => {
		if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
		if (!scheduleUpdated) return res.status(404).send({ message: 'No se pudo solicitar el turno' });
		return res.status(200).send({ schedule: scheduleUpdated });
	})
}

function cancelSingleSchedule(req, res) {
	let userId = req.user.sub;
	let scheduleId = req.body.schedule;
	console.log(scheduleId);
	Schedule.findByIdAndUpdate(scheduleId, { state: "Cancelado" }, { new: true }, (err, scheduleUpdated) => {
		if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
		if (!scheduleUpdated) return res.status(404).send({ message: 'No se pudo solicitar el turno' });
		return res.status(200).send({ schedule: scheduleUpdated });
	})
}

function cancelSelectedSchedule(req, res) {
	let userId = req.user.sub;

	let startDate = req.body.startDate;
	let endDate = req.body.endDate;

	let startDate_format = moment(startDate).format('YYYY-MM-DD');
	let endDate_format = moment(endDate).format('YYYY-MM-DD');
	console.log(startDate_format);
	console.log(endDate_format);

	Schedule.updateMany({date: { $gte: startDate, $lte: endDate }}, { state: "Cancelado" }, { multi: true }, (err, scheduleUpdated) => {
		if (err) return res.status(500).send({ message: 'Error al solicitar el turno' });
		if (!scheduleUpdated) return res.status(404).send({ message: 'No se pudo solicitar el turno' });
		return res.status(200).send({ schedule: scheduleUpdated });
	})

}

function getScheduleByUser(req, res) {
	let userId = req.user.sub;


	Schedule.find({ patient: userId })
		.sort({ date: 'asc', time: 'asc' })
		.populate('doctor')
		.exec((err, schedule) => {
			if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
			if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
			return res.status(200).send({ schedule: schedule });
		});
}

function getTodayScheduleByDoctor(req, res) {
	let userId = req.user.sub;

	let currentDay = moment().format('YYYY-MM-DD');


	Schedule.find({ doctor: userId, date: currentDay }).exec((err, schedule) => {
		if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
		if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
		return res.status(200).send({ schedule: schedule });
	});
}

function getScheduleByDate(req, res) {
	let params = req.params;
	let userId = req.user.sub;

	let startDate = moment(params.startDate).format('YYYY-MM-DD');
	let endDate = moment(params.endDate).format('YYYY-MM-DD');
	let typeUser = params.typeUser;
	console.log(startDate);

	if (typeUser === 'doctor') {
		Schedule.find({ doctor: userId, date: { $gte: startDate, $lte: endDate } }).exec((err, schedule) => {
			if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
			if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
			return res.status(200).send({ schedule: schedule });
		});
	} else {
		console.log("pasa x aca");
		Schedule.find({ patient: userId, date: { $gte: startDate, $lt: endDate } }).exec((err, schedule) => {
			if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
			if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
			return res.status(200).send({ schedule: schedule });
		});
	}

}


function getSchedules(req, res) {

	let speciality = req.params.speciality;
	let startDate = req.params.startDate;
	let startTime = req.params.startTime;
	let endTime = req.params.endTime;
	let profesional = req.params.profesional;

	let date = moment(startDate).format('YYYY-MM-DD');

	console.log("profesional: " + profesional);
	if (typeof profesional !== "undefined" && profesional !== "undefined") {
		User.find({ surname: profesional })
			.exec((err, user) => {
				Schedule.find({ speciality: speciality, date: date, time: { $gte: startTime, $lte: endTime }, doctor: user[0].id, state: 'Disponible' })
					.populate('doctor')
					.exec((err, schedule) => {
						console.log(schedule);
						if (err) return res.status(500).send('Error en la peticion');
						if (!schedule) res.status(404).send('No hay resultados');
						return res.status(200).send({ schedule });
					})
			})
	} else {
		Schedule.find({ speciality: speciality, date: date, time: { $gte: startTime, $lte: endTime }, state: 'Disponible' })
			.populate('doctor')
			.exec((err, schedule) => {
				if (err) return res.status(500).send('Error en la peticion');
				if (!schedule) res.status(404).send('No hay resultados');
				return res.status(200).send({ schedule });
			})

	}

}


function getNextAvailableSchedule(req, res) {
	let speciality = req.params.speciality;
	let profesional = req.params.profesional;
	let date = moment().format('YYYY-MM-DD');
	let time = moment().format('HH:mm')
	if (typeof profesional === "undefined") {
		Schedule.find({ speciality: speciality, state: 'Disponible', date: {$gte: date}, time: {$gte: time}  })
			.populate('doctor')
			.sort({ date: 'asc', time: 'asc' })
			.limit(1)
			.exec((err, schedule) => {

				if (err) return res.status(500).send('Error en la peticion');
				if (!schedule) res.status(404).send('No hay resultados');
				return res.status(200).send({ schedule });
			})
	} else {
		User.find({ surname: profesional })
			.exec((err, user) => {
				Schedule.find({ speciality: speciality, doctor: user[0].id, state: 'Disponible', date: {$gte: date}, time: {$gte: time} })
					.populate('doctor')
					.sort({ date: 'asc', time: 'asc' })
					.limit(1)
					.exec((err, schedule) => {
						console.log(schedule);
						if (err) return res.status(500).send('Error en la peticion');
						if (!schedule) res.status(404).send('No hay resultados');
						return res.status(200).send({ schedule });
					})
			})

	}

}


module.exports = {
	saveScheduleByDoctor,
	saveScheduleBySanatorio,
	getScheduleByUser,
	saveScheduleByUser,
	confirmScheduleByUser,
	getTodayScheduleByDoctor,
	getScheduleByDate,
	getSchedules,
	getNextAvailableSchedule,
	cancelSingleSchedule,
	cancelSelectedSchedule
}