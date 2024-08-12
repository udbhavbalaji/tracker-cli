import { Command } from "commander";
import { getDatasets, writeDatasets, getRelationships, addValidValue, writeRelationships, addRelation } from "../utils/commandUtils.js";
import { inputDatasetValidator } from "../utils/validators.js";
import { mappedValuePrompt } from "../utils/prompts.js";

const addToCommand = new Command('addto')
    .description('Add a valid value to an enum field');


async function addValueToFieldValues(value, fieldId, dataset) {
    let currentField = dataset.fields.find((item) => item.id === fieldId);
    addValidValue(currentField, value);

    let relation = getRelationships(dataset.paths.resources);
    if (fieldId === relation.many) {
        const choices = dataset.fields.find((item) => item.id === relation.one).validValues;
        const mappedValue = await mappedValuePrompt(choices, `Which '${relation.one}' would you like to map '${value}' to?: `);
        addRelation(mappedValue.mappedValue, value, relation);
        writeRelationships(relation, dataset.paths.resources);
    }

    let datasets = getDatasets();
    let currentDatasetIndex = datasets.findIndex((item) => item.command === dataset.command);
    
    datasets[currentDatasetIndex] = dataset;
    writeDatasets({datasets: datasets});
}


addToCommand.argument('<dataset>', 'The dataset to which to the requested field will belong.', (value) => inputDatasetValidator(value))
    .argument('<field>', 'The field to which the value is being added.')
    .argument('<value>', "Value requested to be added to the requested fields' valid values.")
    .action((dataset, field, value) => {
        let datasets = getDatasets();
        let requestedDataset = datasets.find((item) => item.command === dataset);
        let currentField = requestedDataset.fields.find((item) => item.id === field);
        if (!currentField) {
            console.error('Requested field does not exist in this dataset.');
            process .exit(1);
        }
        if (currentField.type !== 'enum') {
            console.error("Requested field is not of type 'enum'.");
            process.exit(1);
        }
        if (currentField.validValues.includes(value)) {
            console.error(`Value '${value}' already exists for field '${field}'.`);
            process.exit(1);
        }
        addValueToFieldValues(value, field, requestedDataset);
    });



export { addToCommand };

