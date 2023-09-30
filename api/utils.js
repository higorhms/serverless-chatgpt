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

function extractBody (event) {
  if (!event.body) {
    return buildResponse(400, {
      message: "Missing body",
    })
  }

  return JSON.parse(event.body);
}

module.exports = {
  buildResponse,
  extractBody
}