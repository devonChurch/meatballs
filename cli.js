#!/usr/bin/env node
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const inquirer = require("inquirer");

const writeFileAsync = promisify(fs.writeFile);
const openAsync = promisify(fs.open);
const copyFileAsync = promisify(fs.copyFile);

const cliDir = __dirname;
const userDir = process.cwd();

console.log({
  cliDir,
  userDir
});

// console.log("GLOBAL", global);

const prConfig = {
  fileName: "PULL_REQUEST_TEMPLATE.md",
  textName: "Pull request"
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
  // debugger;
  // Directories.
  const cliFile = path.resolve(cliDir, fileName);
  const userFile = path.resolve(userDir, fileName);

  console.log({
    cliFile,
    userFile
  });

  // Flags.
  let shouldWrite = true;

  // Check existence.
  try {
    const openResult = await openAsync(userFile, "wx");
    console.log("openResult", openResult);
  } catch (error) {
    console.log("error", error);
    /* ... */
    const inquirerResult = await inquirer.prompt([
      createInquirerConfig(fileName)
    ]);
    console.log("inquirerResult", inquirerResult);
    shouldWrite = inquirerResult.shouldWrite;
  }

  // Write.
  if (shouldWrite) {
    const copyResult = copyFileAsync(cliFile, userFile);
    console.log(`Created new ${textName} template file.`);
  } else {
    console.log(`Skiped ${textName} template file creation.`);
  }

  return shouldWrite;
};

(async () => {
  console.log("Starting sequence");
  const completed = [];

  for (const { fileName, textName } of [prConfig, issueConfig]) {
    try {
      const isComplete = await startFileCreationSequence({
        fileName,
        textName
      });
      if (isComplete) {
        completed.push(fileName);
      }
    } catch (error) {
      console.log("BIG errir", error);
      console.log(`Sorry, there was an error creating your ${fileName}`);
      process.exit(1);
    }
  }

  if (completed.length) {
    console.log(`Sequence complete. Created file(s):`);
    completed.forEach(fileName => console.log(`+ ${fileName}`));
  } else {
    console.log("Sequence completed but created no files.");
  }

  process.exit(0);
})();
