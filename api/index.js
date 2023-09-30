require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { sign } = require('jsonwebtoken');
const { authorize } = require('../auth/jwt/index')

let dbConnection = null;

async function connectToDatabase() {
  if (dbConnection) return dbConnection;
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
  const connection = await client.connect();
  dbConnection = connection.db(process.env.MONGO_DB_NAME);
  return dbConnection;
}

const extractBody = (event) => {
  if (!event.body) {
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
  return JSON.parse(event.body);
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
  const authorization = authorize(event); 
  if (authorization.statusCode === 401) return authorization;
  const { username, id } = authorization;
  
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

    await collection.insertOne({ username, id, response: apiData });

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
    await collection.insertOne({ username, id, response: error?.message });

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

module.exports.login = async (event) => {
  const {username, password} = extractBody(event);

  const hashedPassword = crypto.pbkdf2Sync(password, process.env.SALT, 100000, 64, 'sha512').toString('hex');

  const client = await connectToDatabase();
  const collection = await client.collection('users');

  const user = await collection.findOne({ username: username, password: hashedPassword });

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const token = sign({
    id: user._id,
    username: user.username
  }, process.env.JWT_SECRET, { expiresIn: '24h', audience: 'serverless-chatgpt' })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token })
  }
}