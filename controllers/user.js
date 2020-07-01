let User = require('../models/user');

let bcrypt = require('bcrypt-nodejs');
let jwt = require('../services/jwt');


//prueba
function prueba(req, res) {
	if (req.params.nombre) {
		let nombre = req.params.nombre;
	} else {
		let nombre = "SIN NOMBRE";
	}


	res.status(200).send({
		data: [2, 3, 4],
		message: "Ejemplo ApiRest con nodeJS y EXPRESS" + " - " + nombre
	});

}

function getUser(req, res) {
	let userId = req.params.id;

	User.findById(userId, function (err, user) {
		if (err) return res.status(500).send({ message: 'Error al devolver el usuario' });
		if (!user) return res.status(404).send({ message: 'El usuario no existe' });
		return res.status(200).send({ user });
	});
}


function getUsers(req, res) {
	User.find({}).sort('-_id').exec((err, users) => {
		if (err) {
			res.status(500).send({ message: 'Error al devolver los usuarios' });
		} else {
			if (!users) {
				res.status(404).send({ message: 'No hay usuarios' });
			} else {
				res.status(200).send({ users });
			}
		}
	});

}

//registro de usuario
function saveUser(req, res) {
	let user = new User();
	let params = req.body;

	if (params.name && params.surname && params.password && params.email) {
		user.name = params.name;
		user.surname = params.surname;
		user.email = params.email;
		user.mobile = params.mobile;
		user.prepaid = params.prepaid;
		user.country = params.country;
		user.city = params.city;
		user.address = params.address;
		user.role = params.role;

		//Verifico si el usuario ya existe.
		User.findOne({
			$or: [
				{ email: user.email.toLowerCase() }
			]
		}).exec((err, users) => {
			if (err) return res.status(500).send({ message: 'Error en la peticion de usuarios' });

			if (users && Object.keys(users).length >= 1) {
				return res.status(200).send({ message: 'El usuario ya existe' });
			} else {
				bcrypt.hash(params.password, null, null, (err, hash) => {
					user.password = hash;

					user.save((err, userStored) => {

						if (err) return res.status(500).send({ message: 'Error al guardar el usuario' });

						if (userStored) {

							res.status(200).send({ user: userStored });
						} else {
							res.status(404).send({ message: 'No se ha encontrado el usuario' });
						}
					});
				});
			}
		});


	} else {
		res.status(200).send({
			message: 'Hay campos que faltan completar'
		});
	}

}

//login
function loginUser(req, res) {
	let params = req.body;

	let email = params.email;
	let password = params.password;

	User.findOne({ email: email }, (err, user) => {
		if (err) return res.status(500).send({ message: 'Error en la peticion' });
		
		if (user) {
			bcrypt.compare(password, user.password, (err, check) => {
				if (check) {

					if (params.gettoken) {
						//devolver token
						
						return res.status(200).send({
							token: jwt.createToken(user)
						});
					    
					} else {
						//devolver datos de usuario
						user.password = undefined;
						return res.status(200).send({ user });
					}
				} else {
					return res.status(404).send('El usuario no se ha podido identificar');
				}
			});
		} else {
			return res.status(404).send('El usuario no se ha podido identificar' );
		}

	});

}

//Actualizar los datos de un usuario
function updateUser(req, res) {
	let userId = req.params.id;
	let update = req.body;

	//borrar password
	delete update.password;

	if (userId != req.user.sub) return res.status(500).send({ message: 'No tienes permisos para actualizar los datos del usuario' });

	User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
		if (err) return res.status(500).send({ message: 'Error al actualizar el usuario' });
		if (!userUpdated) return res.status(404).send({ message: 'No se pudo actualizar el usuario' });
		return res.status(200).send({ user: userUpdated });
	});
}

//Eliminar a un usuario
function deleteUser(req, res) {
	let userId = req.params.id;

	User.findById(userId, function (err, user) {
		if (err) {
			res.status(500).send({ message: 'Error al querer eliminar un usuario' });
		}
		if (!user) {
			res.status(404).send({ message: 'El usuario no existe' });
		} else {
			user.remove(err => {
				if (err) {
					res.status(500).send({ message: 'Error al querer eliminar el usuario' });
				} else {
					res.status(200).send({ message: 'El usuario se ha eliminado' });
				}
			});
		}

	});

}


module.exports = {
	prueba,
	getUsers,
	getUser,
	saveUser,
	updateUser,
	deleteUser,
	loginUser
}