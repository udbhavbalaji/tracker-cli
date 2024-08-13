import { Command } from "commander";

import { loadConfig } from "../config/config.js";


const configCommand = new Command('config')
    .description("Interact with the app's configuration settings.");


configCommand.command('show')
    .description("Shows the app's configuration.")
    .action(() => console.log(loadConfig()));


export { configCommand };
