# Prompt Forge

AI Prompt Version Control System built for IntellifyAI Assignment D.

## Features

* Prompt creation and management
* Immutable prompt versioning
* Production promotion workflow
* Rollback system
* Golden dataset testing
* Evaluation pipeline
* Regression detection
* Prompt version comparison

## Tech Stack

* Node.js
* Fastify
* TypeScript
* Prisma ORM
* SQLite

## Architecture

The system treats prompts like production code.

Each prompt can have multiple immutable versions.
Versions can be evaluated against golden datasets before promotion to production.

The evaluation system tests prompt quality and detects regressions before deployment.

## API Endpoints

### Create Prompt

POST /prompts

### Create Prompt Version

POST /prompts/:id/versions

### Promote Version

POST /versions/:versionId/promote

### Rollback Version

POST /versions/:versionId/rollback

### Add Test Case

POST /prompts/:id/testcases

### Evaluate Version

POST /prompts/:promptId/versions/:versionNumber/evaluate

### Compare Versions

GET /prompts/:promptId/diff/:v1/:v2

## Evaluation Logic

Prompt versions are evaluated using golden test datasets.

Each test case contains:

* input
* expected rubric

The evaluation pipeline generates output and scores whether the expected behavior is satisfied.

## Regression Detection

If a new version scores below threshold compared to production, the system flags regressionDetected = true.

## Setup

Install dependencies:

npm install

Run server:

npm run dev

## Reflection

LLM-as-judge systems may give false confidence when:

* evaluation rubrics are vague
* prompts exploit judge wording
* semantic correctness is difficult to measure

Future improvements:

* real OpenAI integration
* async evaluations
* frontend dashboard
* semantic diffing
* automated scoring using judge LLM
