import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// AWS DynamoDB configuration
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'connectly-backend' });
});

// GET /messages - List all messages
app.get('/messages', async (_req, res) => {
  const params = {
    TableName: 'Messages',
  };
  try {
    const data = await dynamoDb.scan(params).promise();
    res.json(data.Items || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.listen(port, () => {
  console.log(`Connectly backend listening on port ${port}`);
}); 