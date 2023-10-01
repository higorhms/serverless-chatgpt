const { buildResponse,  } = require('./utils');

module.exports.handler = async (event) => {
  return buildResponse(200, {
    message: "Go Serverless v3.0! Your function executed successfully!",
    input: event,
  })
};

