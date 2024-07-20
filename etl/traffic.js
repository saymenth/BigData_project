import { 
    parse as parseCsv,
    stringify as toCsv,
 } from "@std/csv";

/**
 * TASK: 0. Read the csv file and parse it
 */

// read the csv file
const csvFile = await Deno.readTextFile('../00-traffic.csv');

// parse the csv
const records = parseCsv(csvFile, {
    skipFirstRow: true,
});

const recordsHeader = Object.keys(records[0]);

/**
 * TASK: 1. Fill in the missing values with the mean of the column. Process the 'Timed Volume' columns (7-30)
 */

const columnTimedVolumeMean = {};

// get the mean of each column
for (let i = 7; i < 31; i++) {
    const key = recordsHeader[i];
    columnTimedVolumeMean[key] = records.reduce((acc, record) => {
        return acc + (parseFloat(record[key]) || 0);
    }, 0) / records.length;
}

// fill in the missing values with the mean of the column
records.map((record) => {
    for (let i = 7; i < 31; i++) {
        const key = recordsHeader[i];
        if (isNaN(parseFloat(record[key]))) {
            record[key] = columnTimedVolumeMean[key];
        }
    }
    return record;
});

/**
 * TASK: 2. Group the columns by Time with 12-hour system (AM/PM), and calculate the average of the columns.
 */

records.map((record) => {
    // get the mean of recordsHeader columns (7-18)
    const timedVolumeAM = recordsHeader.slice(7, 19).reduce((acc, key) => {
        return acc + parseFloat(record[key]);
    }, 0) / 12;

    // get the mean of recordsHeader columns (19-30)
    const timedVolumePM = recordsHeader.slice(19, 31).reduce((acc, key) => {
        return acc + parseFloat(record[key]);
    }, 0) / 12;

    record['AM'] = timedVolumeAM;
    record['PM'] = timedVolumePM;

    // format the date. Original format: MM/DD/YYYY, new format: YYYY-MM-DD
    const dateParts = record['Date'].split('/');
    record['Date'] = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`;

    return record;
});


/**
 * TASK: 3. Group the record based on the Date and Roadway Name columns. If there are multiple records with the same date and roadway name, store the AM and PM values in an array with the key 'AM_collections' and 'PM_collections'
 */

const trafficRecords = {};

records.forEach((record) => {
    const key = `${record['Date']}_${record['Roadway Name']}`;
    if (trafficRecords[key]) {
        trafficRecords[key]['AM_collections'].push(record['AM']);
        trafficRecords[key]['PM_collections'].push(record['PM']);
    } else {
        trafficRecords[key] = {
            'Roadway Name': record['Roadway Name'],
            Date: record['Date'],
            AM: record['AM'],
            PM: record['PM'],
            AM_collections: [record['AM']],
            PM_collections: [record['PM']],
        };
    }
});


/**
 * TASK: 4. Convert the trafficRecords object to an array and sort it by date and roadway name
 */

const trafficRecordsArray = Object.values(trafficRecords);

trafficRecordsArray.sort((a, b) => {
    if (a.Date === b.Date) {
        return a['Roadway Name'] < b['Roadway Name'] ? -1 : 1;
    }

    return a.Date < b.Date ? -1 : 1;
});


/**
 * TASK: 5. Calculate the mean/average of the AM_collections and PM_collections if there are multiple records with the same date and roadway name
 */

// if the AM_collections and PM_collections have multiple records, calculate the mean and store it in the AM and PM properties
trafficRecordsArray.forEach((record) => {
    if (record['AM_collections'].length > 1) {
        record['AM'] = record['AM_collections'].reduce((acc, value) => acc + value, 0) / record['AM_collections'].length;
        delete record['AM_collections'];
    }

    if (record['PM_collections'].length > 1) {
        record['PM'] = record['PM_collections'].reduce((acc, value) => acc + value, 0) / record['PM_collections'].length;
        delete record['PM_collections'];
    }
});

/**
 * TASK: 6. Split each record into two records, one for AM and one for PM
 */

const trafficRecordsArraySplit = trafficRecordsArray.flatMap((record) => {
    return [
        {
            ...record,
            meridiem: 'AM',
            volume: record['AM'],
        },
        {
            ...record,
            meridiem: 'PM',
            volume: record['PM'],
        }
    ];
});

/**
 * TASK: 7. Write the records to a csv file
 */

await Deno.writeTextFile('../01-traffic.csv', toCsv(trafficRecordsArraySplit, {
    columns: [
        {
            header: 'date',
            prop: 'Date',
        },
        'meridiem',
        {
            header: 'roadway name',
            prop: 'Roadway Name',
        },
        'volume',
    ]
}));
