const { saveUser } = require('../database');
const { uploadToBucket, extractCsvDataFromBucket } = require('../integrations/s3');
const { buildResponse, convertCsvDataToUsers, encryptUserPassword } = require('./utils');

module.exports.csvUpload = async (event) => {
  try {
    await uploadToBucket();

    return buildResponse(200, { message: 'Success' })
  } catch (error) {
    console.log(error);
    return buildResponse(error.statusCode || 500, { message: 'Fail' })
  }
}

module.exports.batchUserRegistration = async (event) => {
  try {
    const s3Event = event.Records[0].s3;

    const bucketName = s3Event.bucket.name;
    const bucketKey = decodeURIComponent(s3Event.object.key.replace(/\+/g), " ");

    const fileData = await extractCsvDataFromBucket(bucketName, bucketKey);

    const users = await convertCsvDataToUsers(fileData);

    const encryptedUsersPromises = users.map((user) => encryptUserPassword(user));

    const encryptedUsers = await Promise.all(encryptedUsersPromises)

    const usersPromise = encryptedUsers.map((user) => saveUser(user));

    await Promise.all(usersPromise);
  } catch (error) {
    console.log(error);
  }
}