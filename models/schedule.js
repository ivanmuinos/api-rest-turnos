let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let Schedule = Schema ({
    patient: {type: Schema.ObjectId, ref: 'User'},
    doctor: {type: Schema.ObjectId, ref: 'User'},
    speciality: {type: String},
    date: {type: String},
    time: {type: String},
    state: String
});


module.exports = mongoose.model('Schedule', Schedule);