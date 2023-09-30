require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { sign } = require('jsonwebtoken');
const { buildResponse, extractBody } = require('./utils');
const { authorize } = require('../auth/jwt/index');
const { getUserByCredentials, saveResultsToDatabase } = require('../database');


module.exports.handler = async (event) => {
  return buildResponse(200, {
    message: "Go Serverless v3.0! Your function executed successfully!",
    input: event,
  })
};

module.exports.send = async (event) => {
  const authorization = authorize(event);
  if (authorization.statusCode === 401) return authorization;

  const { username, id } = authorization;

  const body = extractBody(event);
  const endpoint = "https://api.openai.com/v1/engines/davinci/completions";
  const apiKey = process.env.APP_KEY;

  const data = {
    "prompt": body.question,
    "max_tokens": 150
  };

  try {
    const response = await axios.post(endpoint, data, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
    });

    const apiData = response.data;

    await saveResultsToDatabase({ username, id, response: apiData });

    return buildResponse(200, {
      message: apiData.choices[0].text.trim(),
    })
  } catch (error) {
    await saveResultsToDatabase({ username, id, response: error?.message });

    return buildResponse(500, {
      message: `Chatgpt api error: ${error?.message}`,
    })
  }
}

module.exports.login = async (event) => {
  const { username, password } = extractBody(event);

  const hashedPassword = crypto.pbkdf2Sync(password, process.env.SALT, 100000, 64, 'sha512').toString('hex');

  const user = getUserByCredentials(username, hashedPassword);

  if (!user) {
    return buildResponse(401, { error: 'Unauthorized' })
  }

  const token = sign({
    id: user._id,
    username: user.username
  }, process.env.JWT_SECRET, { expiresIn: '24h', audience: 'serverless-chatgpt' })

  return buildResponse(200, { token });
}