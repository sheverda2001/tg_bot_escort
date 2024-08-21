const { Schema, model } = require("mongoose");


const infinity_bot_users = new Schema({
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
    hear_about_us: {
        type: String,
        required: true,
        unique: false
    },
    user_experience: {
        type: String,
        required: true,
        unique: false
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    frozen_balance: {
        type: Number,
        required: true,
        default: 0
    },
    profits: {
        type: Number,
        required: true,
        default: 0
    },
    escort_model: {
        type: [{}],
        required: false,
        default: []
    }

})

module.exports = model("Infinity_bot_users", infinity_bot_users)