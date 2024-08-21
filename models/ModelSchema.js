const { Schema, model } = require("mongoose");


const model_tg_bot_schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: false
    },
    age: {
        type: Number,
        required: true,
        unique: false
    },
    price: {
        hour: {
            type: Number,
            required: true,
            unique: false
        },
        two_hours: {
            type: Number,
            required: true,
            unique: false
        },
        all_night: {
            type: Number,
            required: true,
            unique: false
        }
    },
    photos: {
        type: [String],
        required: false
    },
    description: {
        type: String,
        require: true,
        unique: false
    },
    services: {
        type: String,
        require: true,
        unique: false
    }
})








module.exports = model("model_schema_bot", model_tg_bot_schema)