import { parse } from 'csv';
import fs from 'fs';
import cliProgress from 'cli-progress';

// create a progress bar on terminal
const multibar = new cliProgress.MultiBar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Task: {task}',
}, cliProgress.Presets.shades_grey);

// read the csv file
const csvFile = fs.readFileSync('../fillnull_weather.csv', 'utf8');

// parse the csv file
const records = await parse(csvFile, {
    columns: true,
}).toArray();

const b1 = multibar.create(records.length, 0, {
    task: 'merging records',
});

// create an object to store the weather history records that will be grouped by date and meridiem
const weatherHistory = {};

// on each record, group the records by date and meridiem
records.forEach((record) => {
    // datetime: 2006-04-01 00:00:00.000 +0200

    // get the first 10 characters of the 'Formatted Date' property
    const date = record['Formatted Date'].slice(0, 10);

    // get the next 2 characters after a space of the 'Formatted Date' property
    const meridiem = record['Formatted Date'].slice(11, 13) >= 12 ? 'PM' : 'AM';

    b1.update({ task: `merging records: ${date} ${meridiem}` });
    b1.increment();
    b1.render();

    // find the property in the weatherHistory object named `${date}_${meridiem}`, if it exists, push the record to the 'records' array
    const key = `${date}_${meridiem}`;
    if (weatherHistory[key]) {
        weatherHistory[key].records.push(record);
    } else {
        weatherHistory[key] = {
            date,
            meridiem,
            records: [record],
        };
    }
});

// convert the weatherHistory object to an array
const weatherHistoryArray = Object.values(weatherHistory);

const b2 = multibar.create(weatherHistoryArray.length, 0, {
    task: 'transforming records',
});

// sort the weatherHistoryArray by date and meridiem
weatherHistoryArray.sort((a, b) => {
    if (a.date === b.date) {
        return a.meridiem === 'AM' ? -1 : 1;
    }

    return a.date < b.date ? -1 : 1;
});

// on each record property, create a new object and set it to 'weather' property. the object is the mean/average from the records array
weatherHistoryArray.forEach((item) => {
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

    b2.update({ task: `transformed records: ${item.date} ${item.meridiem}` });
    b2.increment();
    b1.render();
});

// write the weatherHistory to a csv file
const weatherHistoryCsv = weatherHistoryArray.map((item) => {
    return {
        date: item.date,
        meridiem: item.meridiem,
        'Precip Type': item.weather['Precip Type'],
        'Temperature': item.weather['Temperature'],
        'Humidity': item.weather['Humidity'],
        'Wind Speed': item.weather['Wind Speed'],
    };
});

// create a buffer string from the weatherHistoryCsv array and join it with a newline character '\n' which will be written to the csv file
const weatherHistoryCsvString = weatherHistoryCsv.map((item) => {
    return `${item.date},${item.meridiem},${item['Precip Type']},${item['Temperature']},${item['Humidity']},${item['Wind Speed']}`;
}).join('\n');

// the csv header
const header = 'date,meridiem,Precip Type,Temperature,Humidity,Wind Speed\n';

// write the csv file
fs.writeFileSync('../weatherHistoryTransformed.csv', header + weatherHistoryCsvString);

multibar.stop();