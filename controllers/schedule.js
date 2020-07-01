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
	console.log("wtf");
	let date_two_months = moment(params.dateStart).add(2, 'M').format('DD-MM-YYYY');
	console.log(moment(params.dateEnd).isAfter(date_two_months));

	if (moment(params.dateEnd).isAfter(date_two_months)) return res.status(500).send({ message: 'Fecha no permitida' });

	schedule.doctor = doctorId;
	schedule.speciality = params.speciality;
	schedule.date = params.dateStart;
	schedule.time = moment(params.timeStart, 'HH:mm').format("HH:mm");
	schedule.state = "Disponible";


	let a = moment(params.dateEnd, 'DD-MM-YYYY');
	let b = moment(schedule.date, 'DD-MM-YYYY');

	let c = moment(params.timeEnd, 'HH:mm');
	let d = moment(params.timeStart, 'HH:mm');

	let diffDays = moment.duration(a.diff(b)).asDays();
	let diffTime = moment.duration(c.diff(d)).asMinutes();

	let calc = parseInt(diffTime) / parseInt(params.duration);

	let document = [];

	for (var i = 0; i < diffDays + 1; i++) {
		let calcDate = moment(schedule.date, 'DD-MM-YYYY').add(i, 'days').format('DD-MM-YYYY');
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

	Schedule.insertMany(document, (err, mongooseDocuments) => {
		if (err) return res.status(500).send('Error agendar el turno');
		if (!mongooseDocuments) return res.status(404).send('No se pudo agendar el turno');
		return res.status(200).send({ schedule: mongooseDocuments });
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

function getScheduleByUser(req, res) {
	let userId = req.user.sub;


	Schedule.find({ patient: userId })
		.populate('doctor')
		.exec((err, schedule) => {
			if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
			if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
			return res.status(200).send({ schedule: schedule });
		});
}

function getTodayScheduleByDoctor(req, res) {
	let userId = req.user.sub;

	let currentDay = moment().format('DD-MM-YYYY');


	Schedule.find({ doctor: userId, date: currentDay }).exec((err, schedule) => {
		if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
		if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
		return res.status(200).send({ schedule: schedule });
	});
}

function getScheduleByDoctor(req, res) {
	let params = req.body;
	let userId = req.user.sub;

	let startDate = params.startDate;
	let endDate = params.endDate;


	Schedule.find({ doctor: userId, date: { $gte: startDate, $lt: endDate } }).exec((err, schedule) => {
		if (err) return res.status(500).send({ message: 'Error al devolver la agenda' });
		if (!schedule) return res.status(404).send({ message: 'No se pudo devolver la agenda' });
		return res.status(200).send({ schedule: schedule });
	});
}


function getSchedules(req, res) {

	let speciality = req.params.speciality;
	let startDate = req.params.startDate;
	let startTime = req.params.startTime;
	let endTime = req.params.endTime;
	let profesional = req.params.profesional;

	let date = moment(startDate).format('DD-MM-YYYY');

	console.log("profesional: " + profesional);
	if (typeof profesional !== "undefined" && profesional !== "undefined") {
		console.log("x aca");
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

	if (typeof profesional === "undefined") {
		Schedule.find({ speciality: speciality, state: 'Disponible' })
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
				Schedule.find({ speciality: speciality, doctor: user[0].id, state: 'Disponible' })
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
	getScheduleByUser,
	saveScheduleByUser,
	confirmScheduleByUser,
	getTodayScheduleByDoctor,
	getScheduleByDoctor,
	getSchedules,
	getNextAvailableSchedule,
	cancelSingleSchedule,
}