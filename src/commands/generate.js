import path from "path";
import csv from 'csv-parser';
import fs from 'fs';
import moment from "moment";
import { Command } from "commander";
import { createObjectCsvWriter } from "csv-writer";

import { loadConfig } from "../config/config.js";
import { capitalizeFirstLetter, getDateOneYearAgo, checkStartBeforeEnd, getDatasets, getTodaysDate, getFilterableDateField } from "../utils/commandUtils.js";
import { inputDateValidator, inputEnumValidator } from "../utils/validators.js";


const currentConfig = loadConfig();


const generateCommand = new Command('generate')
    .description('Generates a filtered report based on optional filter arguments. By default, returns a report with transactions for the last year.');

    
function generateReport(dates, filename, fields=[]) {
    let results = [];
    let outputFileName = `Tracker ${capitalizeFirstLetter(filename)} Report`;

    let startDate = undefined;
    let endDate = undefined;

    if (dates) {
        startDate = moment(dates.start, currentConfig.dateFormat, true);
        endDate = moment(dates.end, currentConfig.dateFormat, true);
        outputFileName = outputFileName + ` between ${dates.start} - ${dates.end}`
    }

    let datasets = getDatasets();

    let currentReqDataset = datasets.find((item) => item.filename === filename);

    let filterableDateFieldId = getFilterableDateField(currentReqDataset.fields);

    fs.createReadStream(currentReqDataset.paths.dataset)
        .pipe(csv())
        .on('data', (data) => {
            let withinFilter = true;
            if (filterableDateFieldId) {
                const date = moment(data[filterableDateFieldId], currentConfig.dateFormat, true);
                withinFilter = date.isBetween(startDate, endDate, undefined, '[]');
            }
            
            for (let i = 0; i < fields.length; i++) {
                if (data[fields[i].field] !== fields[i].value) {
                    withinFilter = false;
                }
            }
            if (withinFilter) {
                results.push(data);
            }
        })
        .on('end', () => {
            if (results.length === 0) {
                console.error("There are no records that match the required filters.");
                process.exit(1);
            }
            const csvWriter = createObjectCsvWriter({
                path: path.join(currentConfig.reportTargetDir, (outputFileName+'.csv')),
                header: Object.keys(results[0]).map((key) => ({ id: key, title: key }))
            });
            csvWriter.writeRecords(results)
                .then(() => console.log('Report Generated!'))
                .catch((err) => console.error(err.message));
        });
}


let datasets = getDatasets();

for (let i = 0; i < datasets.length; i++) {
    let currentDataset = datasets[i];
    let subCommand = new Command(currentDataset.filename);

    for (let j = 0; j < currentDataset.fields.length; j++) {
        let currentField = currentDataset.fields[j];
        if (currentField.type === 'enum') {
            let fieldParam = `-${currentField.id.substring(0, 3)}, --${currentField.id}, [${currentField.id}]`;
            subCommand.option(fieldParam, "Specify a value to filter on.", (value) => {
                let isEnumValid = inputEnumValidator(value, currentField);
                if (isEnumValid) {
                    return value;
                } else {
                    console.error(`Invalid enum entered. Received '${value}' for field '${currentField.id}'.`);
                    process.exit(1);
                }
            });
        } else if (currentField.type === 'date' && currentField.filterable) {
            subCommand.option('-s, --start, [start]', "Specify a start date for filtering. Defaults to today's date one year ago.", (value) => inputDateValidator(value), getDateOneYearAgo())
            subCommand.option('-e, --end, [end]', "Specify an end date for filtering. Defaults to today's date.", (value) => inputDateValidator(value), getTodaysDate())
        }
    }
    subCommand.action((options) => {
        let dates = undefined;
        let { start, end, ...filters } = options;
        if (start || end) {
            if (!checkStartBeforeEnd(start, end)) {
                console.error('Start date entered is after the end date entered. Enter valid values or omit them for default values.');
                process.exit(1);
            }
            dates = {
                start: start,
                end: end
            };
        }
        let fields = [];
        Object.keys(filters).forEach((key) => fields.push({field: capitalizeFirstLetter(key), value: filters[key]}));
        generateReport(dates, currentDataset.filename, fields);
    });
    generateCommand.addCommand(subCommand);
}


export { generateCommand };
