import { confirmPrompt, initialDatasetFieldsPrompt, secondaryDatasetFieldsPrompt } from "./prompts.js";
import { loadConfig } from "../config/config.js";
import moment from "moment";
import path from 'path';
import fs from 'fs';


export async function getDatasetFields(numFields) {
    let fields = [];
    let filterableDateSelected = false;
    for (let i = 0; i < numFields; i++) {
        let fieldAnswers = await initialDatasetFieldsPrompt();

        const field = {
            id: fieldAnswers.fieldName,
            title: capitalizeFirstLetter(fieldAnswers.fieldName),
            type: fieldAnswers.dataType,
            required: fieldAnswers.isRequired,
            param: fieldAnswers.paramName
        };

        // should be done ; need to confirm
        // todo: allow user to specify ONLY ONE 'date' field to be able to filter on, and save this in the field metadata

        if (!fieldAnswers.isRequired) {
            let defaultParam = `--${fieldAnswers.fieldName}`;
            const secondaryAnswers = await secondaryDatasetFieldsPrompt(fieldAnswers);

            if (secondaryAnswers.paramName !== defaultParam) {
                secondaryAnswers.paramName = secondaryAnswers.paramName + `, ${defaultParam}`;
            }

            field.default = secondaryAnswers.defaultValue;
            field.param = secondaryAnswers.paramName;
        }

        if (fieldAnswers.dataType === 'enum') {
            field.validValues = ["Unknown"];
            if (!fieldAnswers.isRequired) {
                addValidValue(field, field.default);
            }
        } else if (fieldAnswers.dataType === 'date') {
            if (!filterableDateSelected) {
                const makeFilterable = await confirmPrompt('Would you like to make this field filterable? ');
                if (makeFilterable.confirm) {
                    field.filterable = true;
                    filterableDateSelected = true;
                }
            }
        }
        fields.push(field);
    }
    return fields;
}


export function capitalizeFirstLetter(str) {
    if (str.length === 0) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


export function addValidValue(field, value) {
    if (field.validValues.includes(value)) {
        if (value !== "Unknown") {
            console.error("This value already exists in this field's valid values.");
            process.exit(1);
        }
    } else {
        field.validValues.push(value);
    }
}


export function checkEligibility(fields) {
    let countEnumFields = 0;
    let enumFields = [];
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].type === 'enum') {
            countEnumFields++;
            enumFields.push(fields[i].id);
        }
    }
    if (countEnumFields >= 2) {
        return {
            enumFields: enumFields,
            isEligible: true
        };
    }
    return {
        enumFields: enumFields,
        isEligible: false
    };
}


export function getRelationships(filepath) {
    if (fs.existsSync(filepath)) {
        const rawData = fs.readFileSync(filepath);
        return JSON.parse(rawData);
    }
    return {};
}


export function writeRelationships(relationship, filepath) {
    if (!fs.existsSync(path.dirname(filepath))) {
        try {
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
        } catch (err) {
            checkPermissionError(err);
        }
    }
    try {
        fs.writeFileSync(filepath, JSON.stringify(relationship, null, 2));
    } catch (err) {
        checkPermissionError(err);
    }
}


export function getDatasets() {
    const currentConfig = loadConfig();
    if (JSON.stringify(currentConfig) !== '{}') {
        if (fs.existsSync(path.join(currentConfig.resourcesDir, 'datasets.json'))) {
            const datasetsRawData = fs.readFileSync(path.join(currentConfig.resourcesDir, 'datasets.json'));
            let datasetsJSON = JSON.parse(datasetsRawData);
            return datasetsJSON.datasets;
        }
    }
    return [];
}


export function writeDatasets(datasets) {
    const currentConfig = loadConfig();
    try {
        fs.writeFileSync(path.join(currentConfig.resourcesDir, 'datasets.json'), JSON.stringify(datasets, null, 2));
    } catch (err) {
        console.error(err);
    }
}


export function addRelation(oneValue, manyValue, relation) {
    const manyValueObject = relation.values.find((item) => item.many === manyValue);
    if (manyValueObject) {
        manyValueObject.one = oneValue;
    } else {
        relation.values.push({many: manyValue, one: oneValue});
    }
}


export function getTodaysDate() {
    const currentConfig = loadConfig();
    return moment().format(currentConfig.dateFormat);
}


export function getDateOneYearAgo() {
    const currentConfig = loadConfig();
    return moment().subtract(1, 'year').format(currentConfig.dateFormat);
}


export function checkStartBeforeEnd(start, end) {
    const currentConfig = loadConfig();
    let startDate = moment(start, currentConfig.dateFormat, true);
    let endDate = moment(end, currentConfig.dateFormat, true);
    return startDate.isBefore(endDate);
}


export function getFilterableDateField(fields) {
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].type === 'date' && fields[i].filterable) {
            return capitalizeFirstLetter(fields[i].id);
        }
    }
    return false;
}
