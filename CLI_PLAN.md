# Gemini Lens CLI Implementation Plan

## Overview
A command-line interface (CLI) version of Gemini Lens that allows users to bulk-analyze and categorize local files directly from their terminal. It will utilize the `gemini` CLI tool (or a Node.js wrapper around the `@google/genai` SDK) to process files.

## Key Features
1. **Directory Scanning**: Recursively scan a target directory for files.
2. **File Type Filtering (NEW)**: Allow users to filter which file types to process (e.g., `--type image`, `--type document`, `--type all`).
3. **Custom Taxonomy**: Pass custom categories via command-line arguments (e.g., `--categories "Receipts,Invoices,Personal"`).
4. **Batch Processing**: Process files concurrently with a configurable batch size to optimize speed and respect API rate limits.
5. **Structured Output**: Export results to JSON, CSV, or display them in a formatted terminal table.

## Command Structure

```bash
gemini-lens analyze <directory> [options]
```

### Options
*   `-t, --type <fileType>`: Filter by file type. Options: `image`, `audio`, `video`, `document`, `all` (Default: `all`).
*   `-c, --categories <list>`: Comma-separated list of custom categories.
*   `-o, --output <filepath>`: Path to save the output (e.g., `results.json` or `results.csv`).
*   `-b, --batch-size <number>`: Number of files to process concurrently (Default: 3).
*   `-v, --verbose`: Enable detailed logging.

## Implementation Steps

### Step 1: Project Setup & Dependencies
*   Initialize a new Node.js CLI project or add a `bin` script to the existing `package.json`.
*   Install necessary packages:
    *   `commander` or `yargs` for argument parsing.
    *   `mime-types` for detecting file types based on extensions.
    *   `cli-progress` for displaying a progress bar in the terminal.
    *   `chalk` for colored terminal output.

### Step 2: File Discovery & Filtering Logic
*   Implement a function to recursively read the target directory.
*   Use `mime-types` to determine the MIME type of each file.
*   Apply the `--type` filter:
    *   `image`: `mime.startsWith('image/')`
    *   `audio`: `mime.startsWith('audio/')`
    *   `video`: `mime.startsWith('video/')`
    *   `document`: `mime.includes('pdf') || mime.startsWith('text/')`
    *   `all`: Accept all supported types.

### Step 3: Gemini API Integration
*   Adapt the existing `analyzeFile` logic for the Node.js environment.
*   **Execution Method**: The CLI can either spawn child processes calling the official `gemini` CLI tool directly (e.g., `gemini generate content --model gemini-3.1-flash-preview --media <file> "Prompt"`), or use the `@google/genai` SDK directly in the Node.js CLI for better performance, concurrency control, and error handling.

### Step 4: Batch Processing & Progress Tracking
*   Implement a queue system to process files in batches (controlled by `--batch-size`).
*   Initialize a `cli-progress` bar to show the user the overall progress (e.g., `[██████████░░░░░░░░░░] 50% | 10/20 files`).

### Step 5: Output Generation
*   Collect all analysis results (filename, category, description, tags, confidence).
*   Format the output based on the `--output` flag (JSON stringification or CSV formatting).
*   If no output file is specified, print a summary table to the console using `console.table` or a library like `cli-table3`.

## Example Usage

**Analyze only images and output to JSON:**
```bash
gemini-lens analyze ./my-folder --type image --categories "Vacation,Work,Pets" --output results.json
```

**Analyze documents with a larger batch size:**
```bash
gemini-lens analyze ./downloads --type document --batch-size 5
```
