import inquirer from "inquirer";
import { defaultDateValidator, defaultNumberValidator } from "./validators.js";


export async function configurePrompt(defaultConfig) {
    let answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'datasetsDir',
                message: 'Enter the path of the location you want to store your transactions: ',
                default: defaultConfig.datasetsDir
            },
            {
                type: 'input',
                name: 'reportTargetDir',
                message: 'Enter the path of the location you want your reports generated: ',
                default: defaultConfig.reportTargetDir
            },
            {
                type: 'input',
                name: 'resourcesDir',
                message: 'Enter the path of the location you want to store app resources: ',
                default: defaultConfig.resourcesDir
            },
            {
                type: 'list',
                name: 'dateFormat',
                message: 'Choose your preferred date format while logging transactions',
                choices: [
                    'YYYY-MM-DD',
                    'DD-MM-YYYY',
                    'MM-DD-YYYY',
                    'YYYY-DD-MM'
                ],
                default: defaultConfig.dateFormat
            }
        ]);
        return answers;
}


export async function initialDatasetFieldsPrompt() {
    let fieldAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'fieldName',
                message: 'Name of the field: ',
            },
            {
                type: 'list',
                name: 'dataType',
                message: 'What is the type of this field?',
                choices: [
                    'text', 'number', 'date', 'flag', 'enum'
                ],
                default: 'text'
            },
            {
                type: 'confirm',
                name: 'isRequired',
                message: 'Is this field required? (Note: Optional fields require the configuration of a default value)',
                default: false
            }
        ]);
        return fieldAnswers;
}


export async function secondaryDatasetFieldsPrompt(initialFieldAnswers) {
    const defaultParam = `--${initialFieldAnswers.fieldName}`;
    let secondaryPrompts = [
        {
            type: 'input',
            name: 'defaultValue',
            message: 'Specify a default value for this field'
        },
        {
            type: 'input',
            name: 'paramName',
            message: 'How would you like to specify the field when adding/viewing data?',
            default: defaultParam
        }
    ];
    if (initialFieldAnswers.dataType === 'date') {
        secondaryPrompts[0].default = 'TODAYS_DATE';
        secondaryPrompts[0].validate = defaultDateValidator;
    } else if (initialFieldAnswers.dataType === 'flag') {
        secondaryPrompts[0].default = false;
    } else if(initialFieldAnswers.dataType === 'number') {
        secondaryPrompts[0].validate = defaultNumberValidator;
    }
    const secondaryAnswers = await inquirer.prompt(secondaryPrompts);
    return secondaryAnswers;
}


export async function confirmPrompt(message, defaultVal=true) {
    const response = inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: message,
            default: defaultVal
        }
    ]);
    return response;
}


export async function relationFieldsPrompt(choices) {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'manyRelation',
            message: 'Select the field you want to add as the many field in the relation: ',
            choices: choices
        },
        {
            type: 'list',
            name: 'oneRelation',
            message: 'Select the field you want to add as the one field in the relation: ',
            choices: choices
        }
    ]);
    return {
        many: answers.manyRelation,
        one: answers.oneRelation,
        values: [
            {many: "Unknown", one: "Unknown"}
        ]
    };
}


export async function mappedValuePrompt(choices, message) {
    const response = await inquirer.prompt([
        {
            type: 'list',
            name: 'mappedValue',
            message: message,
            choices: choices
        }
    ]);
    return response;
}
