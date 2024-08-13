import fs from 'fs';
import csv from 'csv-parser';
import { Command } from "commander";
import { createObjectCsvWriter } from 'csv-writer';

import { findDataset, getDatasets } from '../utils/commandUtils.js';
import { confirmPrompt } from '../utils/prompts.js';
import { inputDatasetValidator } from '../utils/validators.js';


const deleteFromCommand = new Command('delete-from')
    .description('Deletes the last entered record fromm the specified dataset.')
    .argument('<dataset>', "Specify the dataset from which you want to delete the last record.", (value) => inputDatasetValidator(value));


async function deleteRecord(dataset) {
    let reqDataset = findDataset(dataset);
    let records = [];

    fs.createReadStream(reqDataset.paths.dataset)
        .pipe(csv())
        .on('data', (data) => {
            records.push(data);
        })
        .on('end', async () => {
            console.log(records[records.length-1])
            let confirmDelete = await confirmPrompt('Would you like to delete the above record? ');

            if (confirmDelete.confirm) {
                if (records.pop()) {
                    if (records.length !== 0) {
                        const csvWriter = createObjectCsvWriter({
                            path: reqDataset.paths.dataset,
                            header: Object.keys(records[0]).map((key) => ({ id: key, title: key })),
                            append: (records.length === 0)
                        });
                        csvWriter.writeRecords(records)
                            .then(() => console.log('Record Deleted!'))
                            .catch((err) => { throw err });
                    } else {
                        try {
                            fs.rmSync(reqDataset.paths.dataset);
                            console.log('Record deleted. No more data in dataset.');
                        } catch (err) {
                            console.error(err.message);
                        }
                    }
                } else {
                    console.error('No data exists in this dataset.');
                }
            } else {
                console.log('Aborting delete operation.');
            }
        });
}


deleteFromCommand.action(async (dataset) => await deleteRecord(dataset));


export { deleteFromCommand };
