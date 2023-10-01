const { parse } = require('fast-csv');
const crypto = require('crypto');
const { promisify } = require('util');

function buildResponse(status, body, headers) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  }
}

function extractBody(event) {
  if (!event.body) {
    return buildResponse(400, {
      message: "Missing body",
    })
  }

  return JSON.parse(event.body);
}

async function convertCsvDataToUsers(csvData) {
  const result = await new Promise((resolve, reject) => {
    const users = [];

    const stream = parse({ headers: ["email", "password"], renameHeaders: true })
      .on("data", (user) => users.push({ username: user.email, password: user.password }))
      .on("error", (error) => reject(error))
      .on("end", () => resolve(users))

    stream.write(csvData);
    stream.end();
  })

  if (result instanceof Error) {
    throw result
  };

  return result;
}

async function encryptString(value) {
  promisifiedEncryption = promisify(crypto.pbkdf2Sync)
  const hashedString = await promisifiedEncryption(value, process.env.SALT, 100, 64, 'sha512').toString('hex');

  return hashedString;
}

async function encryptUserPassword(user) {
  user.password = await encryptString(user.password);
  return user;
}


module.exports = {
  encryptString,
  encryptUserPassword,
  convertCsvDataToUsers,
  extractBody,
  buildResponse
}
