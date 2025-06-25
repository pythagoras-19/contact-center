import AWS from 'aws-sdk';

// AWS DynamoDB configuration
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const dynamoDb = new AWS.DynamoDB.DocumentClient(); 