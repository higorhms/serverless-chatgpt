const { verify } = require("jsonwebtoken");
const { buildResponse } = require("../../api/utils");

module.exports.authorize = (event) => {
  const { authorization } = event.headers;

  if (!authorization) {
    return buildResponse(401, { error: 'Unauthorized' })
  }

  const [type, token] = authorization.split(' ');

  if (type !== 'Bearer') {
    return buildResponse(401, { error: 'Unauthorized' })
  }

  try {
    const decodedToken = verify(token, process.env.JWT_SECRET, { audience: 'serverless-chatgpt' });

    return decodedToken;
  } catch (err) {
    return buildResponse(401, { error: 'Unauthorized' })
  }
}