import Fastify from "fastify";
import { promptRoutes } from "./routes/prompt.routes";

const app = Fastify();

app.get("/", async () => {
  return {
    message: "PromptForge Backend Running"
  };
});

// REGISTER ROUTES
app.register(promptRoutes);

const start = async () => {

  try {

    await app.listen({
      port: 3000
    });

    console.log("Server running on port 3000");

  } catch (error) {

    console.log(error);

    process.exit(1);
  }
};

start();