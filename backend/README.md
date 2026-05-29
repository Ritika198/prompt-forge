# Prompt Forge — AI Prompt Version Control System

Prompt Forge is a Prompt Version Control System built for the IntellifyAI Engineering Assessment.

It treats prompts like production code by supporting:

- Prompt creation
- Immutable version history
- Golden dataset evaluation
- Regression detection
- Rollback workflow
- Production prompt execution

---

## Tech Stack

Backend:
- Node.js
- Fastify
- TypeScript
- Prisma
- SQLite

---

## Features

### Prompt Management
- Create prompts
- Create prompt versions
- Preserve immutable history
- Compare prompt versions

### Golden Dataset Evaluation
- Add test cases
- Evaluate prompt versions
- Score outputs
- Detect regressions

### Promotion Workflow
- Promote production versions
- Rollback instantly
- Execute production prompt

---

## API Endpoints

### Create Prompt

POST /prompts

### Create Version

POST /prompts/:id/versions

### Add Test Case

POST /prompts/:id/testcases

### Evaluate Version

POST /prompts/:id/versions/:version/evaluate

### Run Prompt

POST /prompts/:name/run

### Rollback

POST /versions/:id/rollback

---

## Run Locally

Install dependencies:

```bash
npm install
```

Run server:

```bash
npm run dev
```

Server:

```txt
http://localhost:3000
```

---

## Reflection

LLM-as-judge systems may produce false confidence when:

- evaluation rubrics are ambiguous
- prompts require subjective creativity
- scoring instructions are underspecified
- model hallucinations affect grading
