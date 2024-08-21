const { Schema, model } = require("mongoose");



const curators_bot = new Schema({
    id_user: {
        type: String,
        require: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: false
    },
    user_name: {
        type: String,
        required: true,
        unique: true
    },
    interest: {
        type: Number,
        required: true,
        unique: false
    },
    work: {
        type: String,
        required: true,
        unique: false
    },
    users: {
        type: [{}],
        required: false,
        default: []
    }

})

module.exports = model("Curators_bot", curators_bot)