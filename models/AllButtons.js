const allButtons = {
    welcome_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "✅ Согласен с правилами", callback_data: "accept_rules" }]
            ]
        })
    },
    main_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "💝 Модели", callback_data: "models" }],
                [{ text: "👤 Профиль", callback_data: "profile" }, { text: "🔍 Информация", callback_data: "information" }],
                [{ text: "👨‍💻 Тех. поддержка", callback_data: "support" }]
            ]
        })
    },
    currency_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "🇷🇺 RUB", callback_data: "RUB" }],
                [{ text: "‍🇰🇿 KZT", callback_data: "KZT" }],
                [{ text: "‍🇺🇦 UAH", callback_data: "UAH" }]
            ]
        })
    },
    profile_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: "💵 Валюта", callback_data: "currency_change"}],
                [{text: "🏙 Город", callback_data: "city_change"}],
                [{ text: "Вернуться", callback_data: "main_menu" }],
            ]
        })
    },
    city_change_buttons: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: "Вернуться", callback_data: "profile"}],
            ]
        })
    },
    city_change_buttons_complete: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: "↩ В главное меню", callback_data: "main_menu"}],
            ]
        })
    },
    models_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: "🔥 Заказать", callback_data: "order_model"}],
                [{text: "📨 Написать", callback_data: "send_letter"}],
                [{text: "💞 Отзывы", callback_data: "reviews_model"}],
                [{text: "📸 Следущее фото", callback_data: "next_model_photo"}],
                [{text: "Следущая ➡", callback_data: "models"}],
                [{ text: "↩ В главное меню", callback_data: "main_menu" }],
            ]
        })
    },
    information_buttons: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "📝 Гарантии", url: "https://telegra.ph/Polzovatelskoe-soglashenie-dlya-klientov-09-11" }],
                [{ text: "Вернуться", callback_data: "main_menu" }],
            ]
        })
    },
    support_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "Написать", url: "https://t.me/MeganModelsEscortSupport" }],
                [{ text: "Вернуться", callback_data: "main_menu" }],
            ]
        })
    },
    currency_change_return_button: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: "↩ В главное меню", callback_data: "main_menu" }],
            ]
        })
    }
}

module.exports = allButtons;
