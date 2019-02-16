#!/usr/bin/env node

const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const consola = require("consola");
const inquirer = require("inquirer");
const openAsync = promisify(fs.open);
const copyFileAsync = promisify(fs.copyFile);
const cliDir = __dirname;
const userDir = process.cwd();
const space = () => console.log("    ");

const prConfig = {
  fileName: "PULL_REQUEST_TEMPLATE.md",
  textName: "pull request"
};

const issueConfig = {
  fileName: "ISSUE_TEMPLATE.md",
  textName: "issue"
};

const createInquirerConfig = fileName => ({
  type: "confirm",
  name: "shouldWrite",
  message: `The file ${fileName} already exists. Should it be replaced with this new version?`,
  default: false
});

const startFileCreationSequence = async ({ fileName, textName }) => {
  // Directories.
  const cliFile = path.resolve(cliDir, fileName);
  const userFile = path.resolve(userDir, fileName);

  // Flags.
  let shouldWrite = true;

  // Check existence.
  try {
    await openAsync(userFile, "wx");
  } catch (error) {
    const inquirerResult = await inquirer.prompt([
      createInquirerConfig(fileName)
    ]);
    shouldWrite = inquirerResult.shouldWrite;
  }

  // Write.
  if (shouldWrite) {
    await copyFileAsync(cliFile, userFile);
    consola.info(`Created new ${textName} template file.`);
  } else {
    consola.info(`Skiped ${textName} template file creation.`);
  }

  return shouldWrite;
};

(async () => {
  consola.success("Starting sequence.");
  const completed = [];

  for (const { fileName, textName } of [prConfig, issueConfig]) {
    space();
    try {
      const isComplete = await startFileCreationSequence({
        fileName,
        textName
      });
      if (isComplete) {
        completed.push(fileName);
      }
    } catch (error) {
      consola.fatal(
        `Sorry, there was an error creating your ${fileName} template file.`
      );
      process.exit(1);
    }
  }

  space();
  if (completed.length) {
    consola.success(`Sequence complete. Created file(s):`);
    completed.forEach(fileName => consola.log(`> ${fileName}`));
  } else {
    consola.success("Sequence completed but created no files.");
  }

  space();
  process.exit(0);
})();
