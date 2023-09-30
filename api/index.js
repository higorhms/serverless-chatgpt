require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');

async function connectToDatabase(){
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
  const connection = await client.connect();
  return connection.db(process.env.MONGO_DB_NAME);
}

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
  const client = await connectToDatabase();
  const collection = await client.collection('results');

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

    await collection.insertOne(apiData);

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
    await collection.insertOne({ Error: error?.message });

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
