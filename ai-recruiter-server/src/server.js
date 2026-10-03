const { createApp } = require("./app");
const { connectDatabase } = require("./config/database");
const { env } = require("./config/env");

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Recruitment API listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Server startup failed", error);
  process.exit(1);
});
