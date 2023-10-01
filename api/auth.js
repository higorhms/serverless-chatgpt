const { sign } = require('jsonwebtoken');
const { getUserByCredentials } = require("../database");
const { extractBody, encryptString, buildResponse } = require("./utils");

module.exports.login = async (event) => {
  const { username, password } = extractBody(event);

  const hashedPassword = encryptString(password);

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
