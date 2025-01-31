import 'dotenv/config';
import { TeamsActivityHandler, CardFactory } from 'botbuilder';
import axios from 'axios';
import ACData from 'adaptivecards-templating';

const openaiApiKey = process.env.OPENAI_API_KEY;  // Securely get the API key

async function fetchOpenAIResponse(userMessage) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: userMessage }],
                temperature: 0.7,
                max_tokens: 200,
            },
            {
                headers: {
                    Authorization: `Bearer ${openaiApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return "Sorry, I couldn't process your request.";
    }
}

export class SearchApp extends TeamsActivityHandler {
  constructor() {
    super();
    // Add your bot's event handlers here
  }

  async run(context) {
    const userMessage = context.activity.text;
    const responseMessage = await fetchOpenAIResponse(userMessage);
    await context.sendActivity(responseMessage);
  }

  async sendHelloWorldCard(context) {
    const helloWorldCard = await import('./adaptiveCards/helloWorldCard.json', { assert: { type: 'json' } });
    const card = CardFactory.adaptiveCard(helloWorldCard.default);
    await context.sendActivity({ attachments: [card] });
  }
}