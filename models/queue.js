let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let Queue = Schema ({
    patient: {type: Schema.ObjectId, ref: 'User'},
    speciality: {type: String},
});


module.exports = mongoose.model('Queue', Queue);