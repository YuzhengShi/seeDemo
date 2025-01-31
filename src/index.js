// index.js is used to setup and configure your bot

// Import required packages
import express from 'express';
import bodyParser from 'body-parser';
const { json } = bodyParser;

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication } from "botbuilder";
import { SearchApp } from './searchApp.js'; // Correct import
import config from "./config.js";

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const credentialsFactory = new ConfigurationServiceClientCredentialFactory(config);

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialsFactory
);

const adapter = new CloudAdapter(botFrameworkAuthentication);

adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights. See https://aka.ms/bottelemetry for telemetry
  //       configuration instructions.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a message to the user
  await context.sendActivity(`The bot encountered an unhandled error:\n ${error.message}`);
  await context.sendActivity("To continue to run this bot, please fix the bot source code.");
};

// Create the bot that will handle incoming messages.
const searchApp = new SearchApp();

// Create express application.
const expressApp = express();
expressApp.use(json());

const server = expressApp.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${expressApp.name} listening to`, server.address());
});

// Listen for incoming requests.
expressApp.post('/api/messages', async (req, res) => {
  console.log('Received a message');
  await adapter.process(req, res, async (context) => {
    console.log('Processing message');
    await searchApp.run(context);
  });
});

// Gracefully shutdown HTTP server
['exit', 'uncaughtException', 'SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'].forEach((event) => {
  process.on(event, () => {
    server.close();
  });
});
