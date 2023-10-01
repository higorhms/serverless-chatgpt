const { S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs').promises;

let client = null;

function createS3Client() {
  if (client) return client;

  client = new S3Client({
    forcePathStyle: true,
    credentials: {
      accessKeyId: "S3RVER",
      secretAccessKey: "S3RVER"
    },
    endpoint: "http://localhost:4569"
  });

  return client;
}

async function uploadToBucket() {
  const client = createS3Client();

  const filePath = path.join(__dirname, '..', 'csv-example', 'users.csv');

  const csvData = await fs.readFile(filePath, 'utf-8');

  const uploadCommand = new PutObjectCommand({
    Bucket: "users-csv-local",
    Key: "users.csv",
    Body: csvData
  })

  await client.send(uploadCommand);
}

async function extractCsvDataFromBucket(bucketName, bucketKey) {
  const client = createS3Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: bucketKey
  });

  const response = await client.send(command);

  const csvData = await response.Body.transformToString("utf-8");

  return csvData;
}

module.exports = { uploadToBucket, extractCsvDataFromBucket }