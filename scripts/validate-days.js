#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const daysDir = path.join(projectRoot, "docs", "days");

const challengeAnswerPattern = /^(?=.*\p{Lu})[\p{Lu}\p{P} ]+$/u;
const challengeCluePattern = /^[BCDFGHJKLMNPQRSTVWXYZ ]*[BCDFGHJKLMNPQRSTVWXYZ][BCDFGHJKLMNPQRSTVWXYZ ]*$/u;
const nonWhitespacePattern = /\S/u;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isIsoDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function validateExactKeys(value, allowedKeys, fileName, location, errors) {
  const keys = Object.keys(value);

  for (const key of keys) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${fileName}\t${location}\tunexpected property "${key}"`);
    }
  }

  for (const key of allowedKeys) {
    if (!(key in value)) {
      errors.push(`${fileName}\t${location}\tmissing required property "${key}"`);
    }
  }
}

function validateClueEntry(entry, fileName, clueIndex, errors) {
  const location = `challenge.clues[${clueIndex}]`;

  if (!isPlainObject(entry)) {
    errors.push(`${fileName}\t${location}\tmust be an object`);
    return;
  }

  const allowedKeys = ["answer", "clue", "difficulty"];
  for (const key of Object.keys(entry)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${fileName}\t${location}\tunexpected property "${key}"`);
    }
  }

  if (typeof entry.answer !== "string" || entry.answer.length < 1) {
    errors.push(`${fileName}\t${location}.answer\tmust be a non-empty string`);
  } else if (!challengeAnswerPattern.test(entry.answer)) {
    errors.push(`${fileName}\t${location}.answer\tmust contain uppercase letters and only uppercase letters, punctuation, and spaces`);
  }

  if (typeof entry.clue !== "string" || entry.clue.length < 1) {
    errors.push(`${fileName}\t${location}.clue\tmust be a non-empty string`);
  } else if (!challengeCluePattern.test(entry.clue)) {
    errors.push(`${fileName}\t${location}.clue\tmust contain only uppercase consonants and spaces`);
  }

  if ("difficulty" in entry && !isIntegerInRange(entry.difficulty, 1, 10)) {
    errors.push(`${fileName}\t${location}.difficulty\tmust be an integer from 1 to 10`);
  }
}

function validateChallenge(challenge, fileName, errors) {
  const location = "challenge";

  if (!isPlainObject(challenge)) {
    errors.push(`${fileName}\t${location}\tmust be an object`);
    return;
  }

  validateExactKeys(challenge, ["difficulty", "category", "shareClueIndex", "clues"], fileName, location, errors);

  if (!isIntegerInRange(challenge.difficulty, 1, 10)) {
    errors.push(`${fileName}\tchallenge.difficulty\tmust be an integer from 1 to 10`);
  }

  if (typeof challenge.category !== "string" || challenge.category.length < 1 || !nonWhitespacePattern.test(challenge.category)) {
    errors.push(`${fileName}\tchallenge.category\tmust be a non-empty, non-whitespace string`);
  }

  if (!isIntegerInRange(challenge.shareClueIndex, 0, 7)) {
    errors.push(`${fileName}\tchallenge.shareClueIndex\tmust be an integer from 0 to 7`);
  }

  if (!Array.isArray(challenge.clues)) {
    errors.push(`${fileName}\tchallenge.clues\tmust be an array`);
    return;
  }

  if (challenge.clues.length !== 8) {
    errors.push(`${fileName}\tchallenge.clues\tmust contain exactly 8 entries`);
  }

  challenge.clues.forEach((entry, index) => {
    validateClueEntry(entry, fileName, index, errors);
  });
}

function validateDailyChallenge(data, fileName, errors) {
  if (!isPlainObject(data)) {
    errors.push(`${fileName}\t<root>\tmust be an object`);
    return;
  }

  validateExactKeys(data, ["schemaVersion", "date", "challenge"], fileName, "<root>", errors);

  if (!Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) {
    errors.push(`${fileName}\tschemaVersion\tmust be an integer >= 1`);
  }

  if (!isIsoDateString(data.date)) {
    errors.push(`${fileName}\tdate\tmust be a valid YYYY-MM-DD date`);
  }

  if (typeof data.date === "string" && `${data.date}.json` !== fileName) {
    errors.push(`${fileName}\tdate\tmust match the file name`);
  }

  validateChallenge(data.challenge, fileName, errors);
}

function main() {
  const files = fs.readdirSync(daysDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const errors = [];

  for (const fileName of files) {
    const fullPath = path.join(daysDir, fileName);
    let data;

    try {
      data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (error) {
      errors.push(`${fileName}\t<json>\t${error.message}`);
      continue;
    }

    validateDailyChallenge(data, fileName, errors);
  }

  if (errors.length > 0) {
    console.error(`Checked ${files.length} files. Found ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Checked ${files.length} files. All daily challenge files are valid.`);
}

main();
