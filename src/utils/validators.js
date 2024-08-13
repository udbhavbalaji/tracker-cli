import moment from "moment";

import { loadConfig } from "../config/config.js";
import { getDatasets } from "./commandUtils.js";


export function defaultDateValidator(value) {
    const currentConfig = loadConfig();
    if (value === 'TODAYS_DATE') {
        return true;
    }
    if (moment(value, currentConfig.dateFormat, true).isValid()) {
        return true;
    }
    return false; 
}


export function defaultNumberValidator(value) {
    const number = Number(value);

    if (isFinite(number)) {
        return true;
    }
    return false;
}


export function inputDatasetValidator(command) {
    let datasets = getDatasets();
    if (datasets.find((item) => item.command === command)) {
        return command;
    } else {
        console.error('Requested dataset does not exist.');
        process.exit(1);
    }
}


export function inputNumberValidator(value) {
    if (defaultNumberValidator(value)) {
        return value;
    } else {
        console.error('Invalid number input.');
        process.exit(1);
    }
}


export function inputDateValidator(dateInput) {
    const currentConfig = loadConfig();
    const date = moment(dateInput, currentConfig.dateFormat, true);
    if (!date.isValid()){
        console.error("Date format is not valid. Use 'tracker show config' to know which format has been configured.");
        process.exit(1);
    }
    return date.format(currentConfig.dateFormat);
}


export function inputEnumValidator(value, field) {
    if (field.validValues) {
        return field.validValues.includes(value);
    }
    return false;
}
