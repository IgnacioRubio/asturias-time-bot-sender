require('dotenv').config();
const schedule = require('node-schedule');
const Twitter = require('twitter');
const emoji = require('node-emoji')

const Forecasting = require('./src/services/forecasting');

// global variables
const MONTH_NAMES = [ "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" ];

const TIME_RANGE = { "madrugada": "00:00-06:00", "mañana": "06:00-12:00", "tarde": "12:00-18:00", "noche": "18:00-24:00" }

const STATE_SKIES_EMOJIS = { 
  "Cielo despejado": "sunny",
  "Nubes altas": "mostly_sunny",
  "Poco nuboso": "partly_sunny",
  "Intervalos nubosos": "partly_sunny",
  "Nuboso": "barely_sunny",
  "Muy nuboso": "cloud",
  "Intervalos nubosos con lluvia escasa": "partly_sunny",
  "Cubierto con lluvia escasa": "sun_behind_rain_cloud",
  "Cubierto con lluvia": "rain_cloud",
  "Nuboso con lluvia escasa": "rain_cloud",
  "Muy nuboso con lluvia escasa": "rain_cloud",
  "Muy nuboso con lluvia": "rain_cloud",
};

// twitter client
const twClient = new Twitter({
  consumer_key: process.env.TW_CONSUMER_KEY,
  consumer_secret: process.env.TW_CONSUMER_SECRET,
  access_token_key: process.env.TW_TOKEN_KEY,
  access_token_secret: process.env.TW_TOKEN_SECRET 
});

schedule.scheduleJob('0 0 19 * * *', async () => {
  tweet()
});


async function tweet() {
  try {
    console.log(new Date().toString());
    console.log('Running Asturias Weather Sender');

    // tomorrow date
    const tomorrowDate = getTomorrowDate();
    const tomDay = tomorrowDate.getDate();
    const tomMonth = MONTH_NAMES[tomorrowDate.getMonth()];

    // get forecastings' data
    const forecastings = await Forecasting.getFromDB();

    // create new forecastings tweets
    for await (let forecast of forecastings) {
      const msgHeader = `El tiempo para mañana ${tomDay} de ${tomMonth} en #${forecast.municipalityName}:`;

      const msgDawn = `${emoji.get('stopwatch')}${TIME_RANGE['madrugada']} ${emoji.get('thermometer')}${forecast.temperatures[0].value}ºC  ${emoji.get(STATE_SKIES_EMOJIS[forecast.stateSkies[3].descripcion])} ${forecast.precipitations[3].value}%`;

      const msgMorning = `${emoji.get('stopwatch')}${TIME_RANGE['mañana']} ${emoji.get('thermometer')}${forecast.temperatures[1].value}ºC  ${emoji.get(STATE_SKIES_EMOJIS[forecast.stateSkies[4].descripcion])} ${forecast.precipitations[4].value}%`;

      const msgAfternoon = `${emoji.get('stopwatch')}${TIME_RANGE['tarde']} ${emoji.get('thermometer')}${forecast.temperatures[2].value}ºC  ${emoji.get(STATE_SKIES_EMOJIS[forecast.stateSkies[5].descripcion])} ${forecast.precipitations[5].value}%`;

      const msgNight = `${emoji.get('stopwatch')}${TIME_RANGE['noche']} ${emoji.get('thermometer')}${forecast.temperatures[3].value}ºC  ${emoji.get(STATE_SKIES_EMOJIS[forecast.stateSkies[6].descripcion])} ${forecast.precipitations[6].value}%`;

      // message completed
      const msgComplete = `${msgHeader}\n\n   ${msgDawn}\n   ${msgMorning}\n   ${msgAfternoon}\n   ${msgNight}`;

      await twClient.post('statuses/update', { status: msgComplete });
    }

  } catch (err) {
    console.error(err);
  }
}

function getTomorrowDate() {
  let tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  return tomorrowDate;
}