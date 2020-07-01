let User = require('../models/user');
let Queue = require('../models/queue');

let moment = require('moment');
let mongoosePaginate = require('mongoose-pagination');
let bcrypt = require('bcrypt-nodejs');
let jwt = require('../services/jwt');

function saveQueue(req, res) {

	let queue = new Queue();

	let userId = req.user.sub;
	let params = req.body;

	queue.patient = userId;
	queue.speciality = params.speciality;

	queue.save((err, queueStored) => {
		if (err) return res.status(500).send('Error al guardar lista de espera');
		if (!queueStored) return res.status(404).send({ message: 'No se ha podido guardar en lista de espera' });
		return res.status(200).send({ queue: queueStored });
	})

}

function getQueue(req, res) {
	let userId = req.user.sub;

	Queue.find({ patient: userId }).exec((err, queue) => {
		if (err) return res.status(500).send({ message: 'Error al devolver lista de espera' });
		if (!queue) return res.status(404).send({ message: 'No se pudo devolver la lista de espera' });
		return res.status(200).send({ queue: queue });
	})
}


module.exports = {
	saveQueue,
	getQueue,
}