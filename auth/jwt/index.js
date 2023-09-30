const { verify } = require("jsonwebtoken");

module.exports.authorize = (event) => {
  const { authorization } = event.headers;

  if (!authorization) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const [type, token] = authorization.split(' ');

  if (type !== 'Bearer') {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  try {
    const decodedToken = verify(token, process.env.JWT_SECRET, { audience: 'serverless-chatgpt' });

    return decodedToken;
  } catch (err) {
    console.error('Token verification failed:', err.message);

    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }
}