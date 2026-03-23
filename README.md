This is here just to verify that everything works as intended

## Validating Daily Challenge Files

You can validate every file in `docs/days` locally without Codex.

### Requirements

- Node.js installed

No additional npm packages are required.

### Run The Validator

From the `vwlssdailychallenges` project directory, run:

```sh
npm run validate:days
```

This runs [`scripts/validate-days.js`](scripts/validate-days.js).

### What It Checks

The validator checks every `docs/days/*.json` file for:

- valid JSON
- the required daily challenge shape: `schemaVersion`, `date`, `challenge`
- the required nested challenge shape: `difficulty`, `category`, `shareClueIndex`, `clues`
- integer ranges for difficulty and share clue index
- exactly 8 clue entries per file
- valid clue and answer formats
- `date` matching the file name

If everything passes, the script prints:

```text
Checked 45 files. All daily challenge files are valid.
```

## Generating The Manifest

You can regenerate `docs/manifest.json` locally without Codex.

### Run The Generator

From the `vwlssdailychallenges` project directory, run:

```sh
npm run generate:manifest
```

This runs [`scripts/generate-manifest.js`](scripts/generate-manifest.js).

### What It Does

The generator:

- reads every `docs/days/*.json` file
- verifies the file names match the embedded `date` values
- verifies the day files are contiguous with no skipped dates
- sets `contentVersion` to the current UTC date as `YYYY.M.D`
- sets `generatedAt` to the current UTC timestamp rounded to the nearest second
- sets `availableFrom` and `availableTo` from the first and last day files
- writes one manifest entry per day with `date`, `difficulty`, `category`, relative `path`, and SHA-256 `hash`

After regenerating the manifest, you can re-run:

If there was no manifest.json file in the project, then the file generated may not appear in the project, but it should be in the docs folder in the file system, so it can be added easily.

```sh
npm run validate:days
```
