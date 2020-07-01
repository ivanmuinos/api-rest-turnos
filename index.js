'use strict'

var mongoose = require('mongoose');
var app = require('./app');

var port = process.env.PORT || 3700;

mongoose.connect('mongodb://localhost:27017/turnos', (err, res) => {
	if(err){
		throw err;
	}else{
		console.log("Base de datos funcionando correctamente...");
		app.listen(port, function(){
			console.log(`API RESTful de albums funcionando en http://localhost:${port}`);
		});
		
	}
});