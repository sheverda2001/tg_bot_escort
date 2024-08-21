const { Schema, model } = require("mongoose");


const user_tg_bot_schema = new Schema({
    user_id: {
        type: String,
        require: true,
        unique: true
    },
    city: {
        type: String,
        require: true,
        unique: false
    },
    city_change: {
        type: Boolean,
        require: true,
        default: false
    },
    currency: {
        type: String,
        require: true,
        unique: false
    },
    workerId: {
        type: String,
        require: false,
        unique: false
    }
})

module.exports = model("Escort_bot", user_tg_bot_schema)