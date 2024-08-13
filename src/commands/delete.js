import fs from 'fs';
import path from 'path';
import { Command } from "commander";

import { inputDatasetValidator } from "../utils/validators.js";
import { findDataset, getDatasets, writeDatasets } from "../utils/commandUtils.js";
import { confirmPrompt } from '../utils/prompts.js';


const deleteCommand = new Command('delete')
    .description('Delete a dataset from a dataset')
    .argument('<dataset>', "Specify the dataset that you want to delete.", (value) => inputDatasetValidator(value));


async function deleteDataset(dataset) {
    let confirmDelete = await confirmPrompt(`Are you sure you want to delete the '${dataset}' dataset? `);
    if (!confirmDelete.confirm) {
        console.log('Aborting delete operation.');
        process.exit(0);
    }
    let datasets = getDatasets();
    let datasetToDel = datasets.find((item) => item.command === dataset);
    
    try {
        fs.rmSync(path.dirname(datasetToDel.paths.resources), { recursive: true, force: true });
        if (fs.existsSync(datasetToDel.paths.dataset)) {
            fs.rmSync(datasetToDel.paths.dataset);
        }
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }

    datasets = datasets.filter((item) => item.command !== dataset);
    writeDatasets({datasets: datasets});

    console.log('Dataset has been deleted successfully.');
}


deleteCommand.action(async (dataset) => await deleteDataset(dataset));


export { deleteCommand };
