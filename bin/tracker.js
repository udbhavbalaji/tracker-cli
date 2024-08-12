#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig } from "../src/config/config.js";
import { initCommand } from "../src/commands/init.js";
import { createCommand } from "../src/commands/create.js";
import { configCommand } from "../src/commands/config.js"
import { addToCommand } from "../src/commands/addTo.js";
import { trackCommand } from "../src/commands/track.js";
import { generateCommand } from "../src/commands/generate.js";
import { showCommand } from "../src/commands/show.js";
import { deleteFromCommand } from "../src/commands/deleteFrom.js";
import { deleteCommand } from "../src/commands/delete.js";


const currentConfig = loadConfig();


const program = new Command('tracker')
    .description('This tool helps track transactions, with the ability to generate summarized reports, all from the command line.')
    .version('0.1.0');


if (Object.keys(currentConfig).length === 0) {
    program.addCommand(initCommand);
} else {
    program.addCommand(createCommand);
    program.addCommand(addToCommand);
    program.addCommand(trackCommand);
    program.addCommand(showCommand);
    program.addCommand(deleteFromCommand)
    program.addCommand(deleteCommand)
    program.addCommand(generateCommand);
    // todo: replace the 'config show' command with the 'show [config|any]' command to generalize command to view app's/dataset's current state
    program.addCommand(configCommand);
}

program.parse(process.argv);
