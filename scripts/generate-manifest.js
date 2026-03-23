#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const daysDir = path.join(projectRoot, "docs", "days");
const manifestPath = path.join(projectRoot, "docs", "manifest.json");

function formatContentVersion(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}.${month}.${day}`;
}

function formatGeneratedAt(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function readDayFiles() {
  return fs.readdirSync(daysDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((fileName) => {
      const fullPath = path.join(daysDir, fileName);
      const raw = fs.readFileSync(fullPath, "utf8");
      const data = JSON.parse(raw);

      return {
        fileName,
        raw,
        data
      };
    });
}

function validateContiguousDates(dayFiles) {
  for (let index = 0; index < dayFiles.length; index += 1) {
    const expectedFileName = `${dayFiles[index].data.date}.json`;
    if (dayFiles[index].fileName !== expectedFileName) {
      throw new Error(
        `${dayFiles[index].fileName}: top-level date ${dayFiles[index].data.date} does not match the file name`
      );
    }

    if (index === 0) {
      continue;
    }

    const previous = new Date(`${dayFiles[index - 1].data.date}T00:00:00Z`);
    const current = new Date(`${dayFiles[index].data.date}T00:00:00Z`);
    const diffDays = (current - previous) / 86400000;

    if (diffDays !== 1) {
      throw new Error(
        `Day files are not contiguous: ${dayFiles[index - 1].data.date} -> ${dayFiles[index].data.date}`
      );
    }
  }
}

function buildManifest() {
  const now = new Date();
  const dayFiles = readDayFiles();

  if (dayFiles.length === 0) {
    throw new Error("No day files were found in docs/days");
  }

  validateContiguousDates(dayFiles);

  return {
    schemaVersion: 1,
    contentVersion: formatContentVersion(now),
    generatedAt: formatGeneratedAt(now),
    availableFrom: dayFiles[0].data.date,
    availableTo: dayFiles[dayFiles.length - 1].data.date,
    days: dayFiles.map(({ fileName, raw, data }) => ({
      date: data.date,
      difficulty: data.challenge.difficulty,
      category: data.challenge.category,
      path: `days/${fileName}`,
      hash: `sha256:${crypto.createHash("sha256").update(raw, "utf8").digest("hex")}`
    }))
  };
}

function main() {
  const manifest = buildManifest();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(projectRoot, manifestPath)}`);
}

main();
