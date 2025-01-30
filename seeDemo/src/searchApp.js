require('dotenv').config();
const { TeamsActivityHandler, CardFactory } = require('botbuilder');
const axios = require('axios');
const ACData = require('adaptivecards-templating');
const helloWorldCard = require('./adaptiveCards/helloWorldCard.json');

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

class SearchApp extends TeamsActivityHandler {
  constructor() {
    super();
  }

  async handleTeamsMessagingExtensionQuery(context, query) {
    const searchQuery = query.parameters[0].value;

    if (!searchQuery) {
      const welcomeCard = CardFactory.heroCard(
        "Welcome to Response Assistant! 👋",
        "Paste any message you received above and I'll help you craft the perfect response ✨"
      );
      return {
        composeExtension: {
          type: "result",
          attachmentLayout: "list",
          attachments: [welcomeCard],
        },
      };
    }

    if (searchQuery.length < 2) {
      return {
        composeExtension: {
          type: "result",
          attachmentLayout: "list",
          attachments: [],
        },
      };
    }

    const response = await axios.get(
      `${process.env.NPM_REGISTRY_URL}/-/v1/search?${querystring.stringify({
        text: searchQuery,
        size: 8,
      })}`
    );

    const attachments = [];
    response.data.objects.forEach((obj) => {
      const template = new ACData.Template(helloWorldCard);
      const card = template.expand({
        $root: {
          name: obj.package.name,
          description: obj.package.description,
        },
      });
      const preview = CardFactory.heroCard(obj.package.name);
      const attachment = { ...CardFactory.adaptiveCard(card), preview };
      attachments.push(attachment);
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }
}

module.exports = { SearchApp };