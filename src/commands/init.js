import { Command } from "commander";

import { configureApp } from "../config/config.js";


export const initCommand = new Command('init')
    .description("Initializes the app's configuration.")
    .option('-y', 'Initializes the app with default configuration settings.', false)
    .action(async (options) => configureApp(options.y));
