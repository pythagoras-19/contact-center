import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

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

// POST /messages - Create a new message
app.post('/messages', async (req, res) => {
  const { customerName, message } = req.body;
  if (!customerName || !message) {
    return res.status(400).json({ error: 'customerName and message are required' });
  }
  const newMessage = {
    id: uuidv4(),
    customerName,
    message,
    timestamp: new Date().toISOString(),
  };
  const params = {
    TableName: 'Messages',
    Item: newMessage,
  };
  try {
    await dynamoDb.put(params).promise();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.listen(port, () => {
  console.log(`Connectly backend listening on port ${port}`);
}); 