import { 
    parse as parseCsv,
    stringify as toCsv,
 } from "@std/csv";

/**
 * TASK: 0. Read the csv file and parse it
 */

// read the csv file
const csvTrafficFile = await Deno.readTextFile('../01-traffic.csv');
const csvWeatherFile = await Deno.readTextFile('../01-weather.csv');

// parse the csv
const trafficRecords = parseCsv(csvTrafficFile, {
    skipFirstRow: true,
});

const weatherRecords = parseCsv(csvWeatherFile, {
    skipFirstRow: true,
});

/**
 * TASK: 1. Left join traffic <- weather. Merge the records by date
 */

// loop through the traffic records
trafficRecords.forEach((trafficRecord, index) => {
    // find the weather record with the same date and meridiem
    const weather = weatherRecords.find((weatherRecord) => {
        return weatherRecord['date'] === trafficRecord['date'] && weatherRecord['meridiem'] === trafficRecord['meridiem'];
    });

    // if the weather record exists, merge the weather record to the traffic record
    if (weather) {
        trafficRecords[index] = {
            ...trafficRecord,
            ...weather,
        };
    }    
});

/**
 * TASK: 2. Write the records to a csv file
 */

await Deno.writeTextFile('../02-traffic-weather.csv', toCsv(trafficRecords, {
    columns: [
        'date',
        'meridiem',
        'roadway name',
        'volume',
        'precip type',
        'temperature',
        'humidity',
        'wind speed',
    ]
}));
