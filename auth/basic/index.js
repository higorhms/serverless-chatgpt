//Just an example
module.exports.basicAuth = async (event) => {
  const { authorization } = event.headers;

  if (!authorization) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const [type, credentials] = authorization.split(' ');
  if (type !== 'Basic') {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

  const hashedPassword = crypto.pbkdf2Sync(password, process.env.SALT, 100000, 64, 'sha512').toString('hex');

  const client = await connectToDatabase();
  const collection = await client.collection('users');
  const user = await collection.findOne({ name: username, password: hashedPassword });

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  return {
    id: user._id,
    username: user.username
  }
}