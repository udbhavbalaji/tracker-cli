import { Command } from "commander";
import fs from 'fs';
import { createObjectCsvWriter } from "csv-writer";
import { getDatasets, getRelationships, getTodaysDate, addRelation, writeRelationships } from "../utils/commandUtils.js";
import { loadConfig } from "../config/config.js";
import { inputEnumValidator, inputNumberValidator, inputDateValidator } from "../utils/validators.js";
import { confirmPrompt, mappedValuePrompt } from "../utils/prompts.js";


const currentConfig = loadConfig();


const trackCommand = new Command('track')
    .description('Track an entry into a dataset');


function addData(record, filepath, headers) {
    const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: headers,
        append: fs.existsSync(filepath)
    });
    csvWriter.writeRecords([record])
        .then(() => {
            console.log('Record added!');
        })
        .catch((err) => console.error(err.message));
}


const datasets = getDatasets();

for (let i = 0; i < datasets.length; i++) {
    let dataset = datasets[i];
    let fieldsOrder = [];
    let subCommand = new Command(dataset.command);
    for (let j = 0; j < dataset.fields.length; j++) {
        let currentField = dataset.fields[j];
        if (currentField.required) {
            if (currentField.type === 'number') {
                subCommand.argument(`<${currentField.id}>`, 'Required argument.', (value) => inputNumberValidator(value));
            } else if (currentField.type === 'date') {
                subCommand.argument(`<${currentField.id}>`, `Required argument. (${currentConfig.dateFormat})`, (value) => inputDateValidator(value));
            } else if (currentField.type === 'enum') {
                subCommand.argument(`<${currentField.id}>`, 'Required argument.', (value) => {
                    let isEnumValid = inputEnumValidator(value, currentField);
                    if (isEnumValid) {
                        return value;
                    } else {
                        console.error(`Invalid enum entered. Received '${value}' for field '${dataset.fields[j].id}'.`);
                        process.exit(1);
                    }
                });
            } else {
                subCommand.argument(`<${currentField.id}>`, 'Required argument.');
            }
            fieldsOrder.push({id: currentField.id, type: 'required'});
        } else {
            if (currentField.type === 'number') {
                subCommand.option(`${currentField.param}, [${currentField.id}]`, 'Optional argument.', (value) => inputNumberValidator(value), currentField.default);
            } else if (currentField.type === 'text') {
                subCommand.option(`${currentField.param}, [${currentField.id}]`, 'Optional argument.', currentField.default);
            } else if (currentField.type === 'date') {
                let defaultDate = currentField.default;
                if (defaultDate === 'TODAYS_DATE') {
                    defaultDate = getTodaysDate();
                }
                subCommand.option(`${currentField.param}, [${currentField.id}]`, `Optional Argument. (${currentConfig.dateFormat})`, (value) => inputDateValidator(value), defaultDate);
            } else if (currentField.type === 'flag') {
                subCommand.option(`${currentField.param}, [${currentField.id}]`, 'Optional argument.', currentField.default);
            } else {
                subCommand.option(`${currentField.param}, [${currentField.id}]`, 'Optional argument.', (value) => {
                    let isEnumValid = inputEnumValidator(value, currentField);
                    if (isEnumValid) {
                        return value;
                    } else {
                        console.error(`Invalid enum entered. Received '${value}' for field '${currentField.id}'.`);
                        process.exit(1);
                    }
                }, currentField.default);
            }
            fieldsOrder.push({id: currentField.id, type: 'not required'});
        }
    }
    subCommand.action(async (...args) => {
        let record = {};
        let countReq = 0;
        for (let i = 0; i < fieldsOrder.length; i++) {
            if (fieldsOrder[i].type === 'required') {
                record[fieldsOrder[i].id] = args[i];
                countReq++;
            } else {
                record[fieldsOrder[i].id] = undefined;
            }
        }
        const options = args[countReq];
        record = {...record, ...options};

        const relation = getRelationships(dataset.paths.resources);

        if (JSON.stringify(relation) !== '{}') {
            let mappedValue = relation.values.find((obj) => obj.many === record[relation.many]).one;
            let tempOneValue = record[relation.one];

            if (mappedValue === "Unknown") {
                const addMapping = await confirmPrompt(`Would you like to map '${record[relation.many]}' to a new '${relation.one}?: '`);
                if (addMapping.confirm) {
                    const choices = dataset.fields.find((item) => item.id === relation.one).validValues;
                    mappedValue = await mappedValuePrompt(choices, `Which '${relation.one}' would you like to map '${record[relation.many]}' to?: `)
                    addRelation(mappedValue.mappedValue, record[relation.many], relation);
                    record[relation.one] = mappedValue.mappedValue;
                    writeRelationships(relation, dataset.paths.resources);
                }
            } else {
                if (record[relation.one] !== mappedValue) {
                    if (record[relation.one] === "Unknown") {
                        record[relation.one] = mappedValue;
                    } else {
                        let message = `This ${relation.many} has already been mapped to '${mappedValue}'. Override? `;
                        const overrideMapping = await confirmPrompt(message);
                        if (overrideMapping.confirm) {
                            record[relation.one] = tempOneValue;
                        } else {
                            record[relation.one] = mappedValue;
                        }
                    }
                }
            }
        }

        console.log(record);
        const confirmEntry = await confirmPrompt('The above record will be recorded. Confirm?');
        if (confirmEntry.confirm) {
            const filepath = dataset.paths.dataset;
            const headers = dataset.fields.map((item) => { return {id: item.id, title: item.title} });
            addData(record, filepath, headers);
        } else {
            console.log('Data entry aborted.');
        }
    });
    trackCommand.addCommand(subCommand);
}


export { trackCommand };