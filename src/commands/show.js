import fs from 'fs';
import csv from 'csv-parser';
import { Command } from "commander";
import { loadConfig } from "../config/config.js";
import { getDatasets } from "../utils/commandUtils.js";
import { inputDatasetValidator } from "../utils/validators.js";


const showCommand = new Command('show')
    .description("Shows the app's/dataset's current state");


showCommand.command('config')
    .description("Shows the app's current configuration settings.")
    .action(() => console.log(loadConfig()));


showCommand.command('datasets')
    .description("Shows the initialized datasets.")
    .action(() => {
        let datasets = getDatasets();
        console.log('');
        for (let i = 0; i < datasets.length; i++) {
            console.log(datasets[i].command);
        }
        console.log('');
    });


showCommand.command('fields')
    .description("Shows the fields in a requested dataset.")
    .option('-d, <dataset>', 'The dataset name that you want the field for.', (value) => inputDatasetValidator(value))
    .option('-i, --info, [info]', 'Flag indicating to show info of fields in the dataset.', false)
    .action((options) => {
        console.log(options);
        let reqDatasetName = options.d;
        if (!reqDatasetName) {
            console.error("Please enter a dataset with the '-d' option.");
            process.exit(1);
        }
        let datasets = getDatasets();
        let reqDataset = datasets.find((item) => item.command === reqDatasetName);
        console.log('');
        reqDataset.fields.forEach((item) => {
            if (options.info) {
                console.log(`${item.id} - ${item.type}; Required: ${item.required}`);
            } else {
                console.log(item.id);
            }
        });
        console.log('');
    });


showCommand.command('valid-values')
    .description('Shows all the valid values in the specified field in the specified dataset.')
    .option('-d, --dataset, [dataset]', 'Specify the dataset that the field belongs to.', (value) => inputDatasetValidator(value))
    .option('-f, --field, [field]', "Specify the field in the specified dataset.")
    .action((options) => {
        if (!options.dataset) {
            console.error('Missing required option -d, --dataset.');
            process.exit(1);
        }
        if (!options.field) {
            console.error('Missing required option -f, --field.');
            process.exit(1);
        }
        let datasets = getDatasets();
        let reqDataset = datasets.find((item) => item.command === options.dataset);
        let reqField = reqDataset.fields.find((item) => item.id === options.field);
        if (!reqField) {
            console.error("Field doesn't exist in requested dataset.");
            process.exit(1);
        }
        if (reqField.type !== 'enum') {
            console.error("Field is not of type 'enum'. Can take infinite valid values.");
            process.exit(1);
        }
        console.log('');
        for (let i = 0; i < reqField.validValues.length; i++) {
            let validValue = reqField.validValues[i];
            console.log(`${i+1} - ${validValue}`);
        }
        console.log('');
    });


showCommand.command('last')
    .description("Shows the last 'n' data points entered into the specified dataset.")
    .argument('<num>', "Number of most recent data points you want to see.", (value) => {
        if (value < 1) {
            console.error('Invalid num entered.');
            process.exit(1);
        }
        return value;
    })
    .argument('<dataset>', "Specify the dataset whose transactions you want to see.", (value) => inputDatasetValidator(value))
    .action((num, dataset) => {
        let requiredRecords = [];
        let datasets = getDatasets();
        let reqDataset = datasets.find((item) => item.command === dataset);

        fs.createReadStream(reqDataset.paths.dataset)
            .pipe(csv())
            .on('data', (data) => {
                requiredRecords.push(data);
                if (requiredRecords.length > num) {
                    requiredRecords.shift();
                }
            })
            .on('end', () => {
                console.table(requiredRecords.reverse());
            });
    });


export { showCommand };