import { 
    parse as parseCsv,
    stringify as toCsv,
 } from "@std/csv";

/**
 * TASK: 0. Read the csv file and parse it
 */

// read the csv file
const csvFile = await Deno.readTextFile('../00-weather.csv');

// parse the csv
const records = parseCsv(csvFile, {
    skipFirstRow: true,
});

/**
 * TASK: 1. Group the records by date and meridiem (AM/PM)
 */

// an object to store the weather history records that will be grouped by date and meridiem
const weatherHistory = {};

// on each record, group the records by date and meridiem
records.forEach((record) => {
    // Formatted Date: YYYY-MM-DD HH:mm:ss.SSS ±HHmm

    // get the first 10 characters of the 'Formatted Date' property
    const date = record['Formatted Date'].slice(0, 10);

    // get the next 2 characters after a space of the 'Formatted Date' property
    const meridiem = record['Formatted Date'].slice(11, 13) >= 12 ? 'PM' : 'AM';

    // find the property in the weatherHistory object with the name: `${date}_${meridiem}`, if it exists, push the record to the 'records' array
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

/**
 * TASK: 2. Convert the weatherHistory object to an array and sort it by date and meridiem
 */

// convert as array
const weatherHistoryArray = Object.values(weatherHistory);

// sort by date and meridiem
weatherHistoryArray.sort((a, b) => {
    if (a.date === b.date) {
        return a.meridiem === 'AM' ? -1 : 1;
    }

    return a.date < b.date ? -1 : 1;
});

/**
 * TASK: 3. Calculate the mean/average from the records array of each group
 */

weatherHistoryArray.forEach((item) => {
    // get the most common Precip Type
    const precipType = item.records.reduce((acc, record) => {
        // If Some records have 'Precip Type' as 'null', define it based on the 'Summary' property
        if (record['Precip Type'] === 'null') {
            if (['Mostly Cloudy', 'Partly Cloudy', 'Overcast'].includes(record['Summary'])) {
                record['Precip Type'] = 'Cloudy';
            } else if (record['Summary'] === 'Clear') {
                record['Precip Type'] = 'Clear';
            } else if (record['Summary'] === 'Foggy') {
                record['Precip Type'] = 'Fog';
            }
        }


        if (record['Precip Type'] in acc) {
            acc[record['Precip Type']] += 1;
        } else {
            acc[record['Precip Type']] = 1;
        }

        return acc;
    }, {});

    item.weather = {
        'Precip Type': Object.keys(precipType).reduce((a, b) => (precipType[a] > precipType[b] ? a : b)).toLowerCase(),
        'Temperature': item.records.reduce((acc, record) => acc + parseFloat(record['Temperature (C)']), 0) / item.records.length,
        'Humidity': item.records.reduce((acc, record) => acc + parseFloat(record['Humidity']), 0) / item.records.length,
        'Wind Speed': item.records.reduce((acc, record) => acc + parseFloat(record['Wind Speed (km/h)']), 0) / item.records.length,
    };
});

/**
 * TASK: 4. Write the records to a csv file
 */

await Deno.writeTextFile('../01-weather.csv', toCsv(weatherHistoryArray, {
    columns: [
        'date',
        'meridiem',
        {
            header: 'precip type',
            prop: ['weather', 'Precip Type'],
        },
        {
            header: 'temperature',
            prop: ['weather', 'Temperature'],
        },
        {
            header: 'humidity',
            prop: ['weather', 'Humidity'],
        },
        {
            header: 'wind speed',
            prop: ['weather', 'Wind Speed'],
        },
    ]
}));
