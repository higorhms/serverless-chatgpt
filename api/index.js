require('dotenv').config();
const axios = require('axios');

const extractBody = (event) => {
  if(!event.body){
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Go Serverless v3.0! Your function executed successfully!",
        },
      ),
      headers: {
        'Content-type': 'application/json'
      }
    };
  }
  return event.body;
}

module.exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.send = async (event) => {
  const body = extractBody(event);
  const endpoint = "https://api.openai.com/v1/engines/davinci/completions";
  const apiKey = process.env.APP_KEY;

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  const data = {
    "prompt": body.question,
    "max_tokens": 150
  };

  try {
    const response = await axios.post(endpoint, data, {
      headers: headers,
    });

    const apiData = response.data;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: apiData.choices[0].text.trim(),
      }),
      headers: {
        'Content-type': 'application/json'
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Chatgpt api error: ${error?.message}`,
      }),
      headers: {
        'Content-type': 'application/json'
      }
    }
  }
}
