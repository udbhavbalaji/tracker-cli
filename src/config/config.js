import os from "os";
import path from "path";
import fs from "fs";

import { configurePrompt } from "../utils/prompts.js";
import {
  storeSudoUserInfo,
  createUserOwnedDirs,
  checkPermissionError,
} from "../utils/configUtils.js";

const homeDir = os.homedir();
let configDir = path.join(homeDir, ".config");
configDir = path.join(configDir, "tracker-cli");
const configFilePath = path.join(configDir, "config.json");
const appDir = path.join(homeDir, ".tracker-cli");

export function loadConfig() {
  if (fs.existsSync(configFilePath)) {
    const rawData = fs.readFileSync(configFilePath);
    return JSON.parse(rawData);
  }
  return {};
}

function saveConfig(config) {
  if (!fs.existsSync(configDir)) {
    try {
      fs.mkdirSync(configDir, { recursive: true });
    } catch (err) {
      checkPermissionError(err);
    }
  }
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
  } catch (err) {
    checkPermissionError(err);
  }
}

export async function configureApp(defaultChoiceFlag) {
  let sudoUserInfo = storeSudoUserInfo();

  if (!sudoUserInfo.gid && !sudoUserInfo.uid && !sudoUserInfo.username) {
    console.error("Please use 'sudo tracker init' to initialize the app");
    process.exit(1);
  }

  let chosenConfig = null;
  let defaultConfig = {
    datasetsDir: path.join(appDir, "datasets"),
    reportTargetDir: path.join(homeDir, "Downloads"),
    resourcesDir: path.join(appDir, "resources"),
    dateFormat: "YYYY-MM-DD",
  };

  if (!defaultChoiceFlag) {
    let answers = await configurePrompt(defaultConfig);
    chosenConfig = answers;
  } else {
    chosenConfig = defaultConfig;
  }

  saveConfig(chosenConfig);
  createUserOwnedDirs(
    [
      chosenConfig.datasetsDir,
      chosenConfig.reportTargetDir,
      chosenConfig.resourcesDir,
    ],
    sudoUserInfo.uid,
    sudoUserInfo.gid
  );

  console.log(
    "App configuration complete! Use 'tracker -h' to view available commands and options."
  );
}
