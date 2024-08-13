import { Command } from "commander";
import path from 'path';

import { loadConfig } from "../config/config.js";
import { getDatasetFields, writeDatasets, checkEligibility, writeRelationships, getDatasets } from "../utils/commandUtils.js";
import { confirmPrompt, relationFieldsPrompt } from "../utils/prompts.js";


const currentConfig = loadConfig();
const createCommand = new Command('create')
    .description('Creates a new dataset.');

    
async function createDataset(name, numFields) {
    let datasetMetadata = {
        command: name,
        filename: name + 's'
    };

    let fields = await getDatasetFields(numFields);
    datasetMetadata.fields = fields;
    
    const datasetDataPath = path.join(currentConfig.datasetsDir, `${datasetMetadata.filename}.csv`);

    let datasetResourcesPath = path.join(currentConfig.resourcesDir, datasetMetadata.filename);
    datasetResourcesPath = path.join(datasetResourcesPath, `${datasetMetadata.filename}.json`);

    datasetMetadata.paths = {
        dataset: datasetDataPath,
        resources: datasetResourcesPath
    };

    let eligibility = checkEligibility(fields);

    if (eligibility.isEligible) {
        const confirmation = await confirmPrompt('Would you like to specify relationships between fields in the dataset?');
        
        if (confirmation.confirm) {
            const datasetRelations = await relationFieldsPrompt(eligibility.enumFields);
            writeRelationships(datasetRelations, datasetMetadata.paths.resources);
        } else {
            console.log('Completing dataset creation without specifying any relationships');
        }
    } else {
        console.log('This dataset is not eligible to configure relationships.');
    }

    let datasets = getDatasets();
    datasets.push(datasetMetadata);
    writeDatasets({datasets: datasets});
    console.log('Dataset has been created.');
}


createCommand.argument('<name>', 'Name of the dataset you want to create.')
    .argument('<num_fields>', 'Number of fields that your dataset will have.')
    .action(async (name, numFields) => await createDataset(name, numFields));


export { createCommand };
