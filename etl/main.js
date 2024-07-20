import { parse } from 'csv';
import fs from 'fs';
import cliProgress from 'cli-progress';

const multibar = new cliProgress.MultiBar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Task: {task}',
}, cliProgress.Presets.shades_grey);

const csvFile = fs.readFileSync('../fillnull_weather.csv', 'utf8');

const records = await parse(csvFile, {
    columns: true,
}).toArray();

const b1 = multibar.create(records.length, 0, {
    task: 'merging records',
});

const weatherHistory = [];

records.forEach((record) => {
    // get the date and ignore the timezones
    const dateTime = new Date(record['Formatted Date'].split('+')[0]);

    // const date = dateTime.toISOString().split('T')[0];
    const date = `${dateTime.getFullYear()}-${dateTime.getMonth() + 1}-${dateTime.getDate()}`;
    const meridiem = dateTime.getHours() >= 12 ? 'PM' : 'AM';

    b1.increment();
    b1.update({ task: `merging records: ${date} ${meridiem}` });
    b1.render();

    // check if the date and meridiem exists in the weatherHistory
    const dateIndex = weatherHistory.findIndex((item) => new Date(item.date).toISOString().split('T')[0] === date && item.meridiem === meridiem);

    // if the date and meridiem exists, add the record to the records array
    if (dateIndex !== -1) {
        weatherHistory[dateIndex].records.push(record);
    } else {
        // if the date and meridiem doesn't exist, create a new object
        weatherHistory.push({
            date,
            meridiem,
            records: [record],
        });
    }
});

const b2 = multibar.create(weatherHistory.length, 0, {
    task: 'transforming records',
});

// on each record property, create a new object and set it to 'weather' property. the object is the mean/average from the records array
weatherHistory.forEach((item) => {
    const weather = {};

    // Precip Type, Temperature, Humidity, Wind Speed

    // get the most common Precip Type
    const precipType = item.records.reduce((acc, record) => {
        if (record['Precip Type'] in acc) {
            acc[record['Precip Type']] += 1;
        } else {
            acc[record['Precip Type']] = 1;
        }

        return acc;
    }, {});

    // get the most common Precip Type
    weather['Precip Type'] = Object.keys(precipType).reduce((a, b) => (precipType[a] > precipType[b] ? a : b)).toLowerCase();

    // get the average Temperature
    weather['Temperature'] = item.records.reduce((acc, record) => acc + parseFloat(record['Temperature (C)']), 0) / item.records.length;

    // get the average Humidity
    weather['Humidity'] = item.records.reduce((acc, record) => acc + parseFloat(record['Humidity']), 0) / item.records.length;

    // get the average Wind Speed
    weather['Wind Speed'] = item.records.reduce((acc, record) => acc + parseFloat(record['Wind Speed (km/h)']), 0) / item.records.length;

    item.weather = weather;

    // b2.update(b2.getProgress() + 1, { filename: `transformed records: ${item.date} ${item.meridiem}` });
    b2.increment(null, { task: `transformed records: ${item.date} ${item.meridiem}` });
});

// write the weatherHistory to a csv file
const weatherHistoryCsv = weatherHistory.map((item) => {
    return {
        date: item.date,
        meridiem: item.meridiem,
        'Precip Type': item.weather['Precip Type'],
        'Temperature': item.weather['Temperature'],
        'Humidity': item.weather['Humidity'],
        'Wind Speed': item.weather['Wind Speed'],
    };
});

const weatherHistoryCsvString = weatherHistoryCsv.map((item) => {
    return `${item.date},${item.meridiem},${item['Precip Type']},${item['Temperature']},${item['Humidity']},${item['Wind Speed']}`;
}).join('\n');

// add the header
const header = 'date,meridiem,Precip Type,Temperature,Humidity,Wind Speed\n';

fs.writeFileSync('../weatherHistoryTransformed.csv', header + weatherHistoryCsvString);

multibar.stop();