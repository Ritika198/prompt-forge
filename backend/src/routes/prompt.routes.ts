import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";

export async function promptRoutes(app: FastifyInstance) {

  // CREATE PROMPT
  app.post("/prompts", async (request, reply) => {

    const body: any = request.body;

    const prompt = await prisma.prompt.create({
      data: {
        name: body.name,
        description: body.description
      }
    });

    return reply.send(prompt);
  });

  // GET ALL PROMPTS
  app.get("/prompts", async () => {

    const prompts = await prisma.prompt.findMany({
      include: {
        versions: true,
        testCases: true
      }
    });

    return prompts;
  });

  // CREATE NEW VERSION
  app.post("/prompts/:id/versions", async (request, reply) => {

    const params: any = request.params;
    const body: any = request.body;

    const promptId = params.id;

    // FIND EXISTING VERSIONS
    const existingVersions = await prisma.promptVersion.findMany({
      where: {
        promptId
      },
      orderBy: {
        versionNumber: "desc"
      }
    });

    // NEXT VERSION NUMBER
    const nextVersion =
      existingVersions.length > 0
        ? existingVersions[0].versionNumber + 1
        : 1;

    // CREATE VERSION
    const version = await prisma.promptVersion.create({
      data: {
        promptId,
        versionNumber: nextVersion,
        template: body.template,
        isProduction: false
      }
    });

    return reply.send(version);
  });

  // PROMOTE VERSION TO PRODUCTION
  app.post("/versions/:versionId/promote", async (request, reply) => {

    const params: any = request.params;

    const versionId = params.versionId;

    const version = await prisma.promptVersion.findUnique({
      where: {
        id: versionId
      }
    });

    if (!version) {
      return reply.status(404).send({
        error: "Version not found"
      });
    }

    // REMOVE OLD PRODUCTION
    await prisma.promptVersion.updateMany({
      where: {
        promptId: version.promptId
      },
      data: {
        isProduction: false
      }
    });

    // SET NEW PRODUCTION
    const updatedVersion = await prisma.promptVersion.update({
      where: {
        id: versionId
      },
      data: {
        isProduction: true
      }
    });

    return reply.send({
      message: "Version promoted successfully",
      version: updatedVersion
    });
  });

  // ROLLBACK TO VERSION
  app.post("/versions/:versionId/rollback", async (request, reply) => {

    const params: any = request.params;

    const versionId = params.versionId;

    const version = await prisma.promptVersion.findUnique({
      where: {
        id: versionId
      }
    });

    if (!version) {
      return reply.status(404).send({
        error: "Version not found"
      });
    }

    // REMOVE CURRENT PRODUCTION
    await prisma.promptVersion.updateMany({
      where: {
        promptId: version.promptId
      },
      data: {
        isProduction: false
      }
    });

    // RESTORE OLD VERSION
    const rollbackVersion = await prisma.promptVersion.update({
      where: {
        id: versionId
      },
      data: {
        isProduction: true
      }
    });

    return reply.send({
      message: "Rollback successful",
      version: rollbackVersion
    });
  });

  // RUN PRODUCTION PROMPT
  app.post("/prompts/:name/run", async (request, reply) => {

    const params: any = request.params;
    const body: any = request.body;

    const promptName = params.name;

    // FIND PROMPT
    const prompt = await prisma.prompt.findFirst({
      where: {
        name: promptName
      },
      include: {
        versions: true
      }
    });

    if (!prompt) {
      return reply.status(404).send({
        error: "Prompt not found"
      });
    }

    // FIND PRODUCTION VERSION
    const productionVersion = prompt.versions.find(
      (v) => v.isProduction === true
    );

    if (!productionVersion) {
      return reply.status(400).send({
        error: "No production version found"
      });
    }

    let finalPrompt = productionVersion.template;

    // REPLACE VARIABLES
    const variables = body.variables || {};

    for (const key in variables) {

      const value = variables[key];

      finalPrompt = finalPrompt.replaceAll(
        `{{${key}}}`,
        value
      );
    }

    // MOCK AI RESPONSE
    const fakeResponse = `
AI Response Generated Successfully

Processed Prompt:
${finalPrompt}

This is a mocked LLM response for assignment demonstration.
`;

    return reply.send({
      promptUsed: finalPrompt,
      output: fakeResponse
    });

  });

  // ADD TEST CASE
  app.post("/prompts/:id/testcases", async (request, reply) => {

    const params: any = request.params;
    const body: any = request.body;

    const promptId = params.id;

    const testCase = await prisma.testCase.create({
      data: {
        promptId,
        input: body.input,
        expected: body.expected
      }
    });

    return reply.send(testCase);
  });

  // EVALUATE PROMPT VERSION
  app.post(
    "/prompts/:promptId/versions/:versionNumber/evaluate",
    async (request, reply) => {

      const params: any = request.params;

      const promptId = params.promptId;
      const versionNumber = parseInt(params.versionNumber);

      // FIND VERSION
      const version = await prisma.promptVersion.findFirst({
        where: {
          promptId,
          versionNumber
        }
      });

      if (!version) {
        return reply.status(404).send({
          error: "Version not found"
        });
      }

      // GET TEST CASES
      const testCases = await prisma.testCase.findMany({
        where: {
          promptId
        }
      });

      const results = [];

      let passedCount = 0;

      // RUN TESTS
      for (const testCase of testCases) {

        const generatedOutput = `
Mock AI Output:
${version.template}

Input:
${testCase.input}
`;

        // SIMPLE MOCK EVALUATION
        const passed =
          version.template.toLowerCase().includes("refund");

        if (passed) {
          passedCount++;
        }

        results.push({
          testCaseId: testCase.id,
          input: testCase.input,
          expected: testCase.expected,
          output: generatedOutput,
          passed
        });
      }

      // FINAL SCORE
      const score =
        testCases.length > 0
          ? (passedCount / testCases.length) * 100
          : 0;

      // FIND PRODUCTION VERSION
      const productionVersion = await prisma.promptVersion.findFirst({
        where: {
          promptId,
          isProduction: true
        }
      });

      let regressionDetected = false;

      // REGRESSION LOGIC
      if (
        productionVersion &&
        productionVersion.versionNumber !== version.versionNumber
      ) {
        regressionDetected = score < 70;
      }

      return reply.send({
        versionNumber,
        totalTests: testCases.length,
        passedTests: passedCount,
        score,
        regressionDetected,
        results
      });

    }
  );

  // COMPARE TWO PROMPT VERSIONS
  app.get(
    "/prompts/:promptId/diff/:v1/:v2",
    async (request, reply) => {

      const params: any = request.params;

      const promptId = params.promptId;

      const v1 = parseInt(params.v1);
      const v2 = parseInt(params.v2);

      const version1 = await prisma.promptVersion.findFirst({
        where: {
          promptId,
          versionNumber: v1
        }
      });

      const version2 = await prisma.promptVersion.findFirst({
        where: {
          promptId,
          versionNumber: v2
        }
      });

      if (!version1 || !version2) {
        return reply.status(404).send({
          error: "Version not found"
        });
      }

      return reply.send({
        version1: {
          version: version1.versionNumber,
          template: version1.template
        },
        version2: {
          version: version2.versionNumber,
          template: version2.template
        }
      });

    }
  );

}