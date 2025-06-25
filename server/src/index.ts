import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './authRoutes';
import { authenticateToken, AuthenticatedRequest } from './auth';

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

// Authentication routes
app.use('/auth', authRoutes);

// GET /chats - List all chats (unique chatIds, with latest message) - Protected
app.get('/chats', authenticateToken, async (_req: Request, res: Response) => {
  const params = {
    TableName: 'Messages',
    ProjectionExpression: 'chatId, customerName, message, #ts',
    ExpressionAttributeNames: {
      '#ts': 'timestamp'
    },
  };
  try {
    const data = await dynamoDb.scan(params).promise();
    // Group by chatId and get the latest message for each chat
    const chatsMap: Record<string, any> = {};
    (data.Items || []).forEach((item: any) => {
      if (!chatsMap[item.chatId] || item.timestamp > chatsMap[item.chatId].timestamp) {
        chatsMap[item.chatId] = item;
      }
    });
    const chats = Object.values(chatsMap);
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// GET /chats/:chatId/messages - List all messages for a chat (scan + filter) - Protected
app.get('/chats/:chatId/messages', authenticateToken, async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const params = {
    TableName: 'Messages',
    FilterExpression: 'chatId = :chatId',
    ExpressionAttributeValues: {
      ':chatId': chatId,
    },
  };
  try {
    const data = await dynamoDb.scan(params).promise();
    // Sort by timestamp ascending
    const items = (data.Items || []).sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));
    res.json(items);
  } catch (error) {
    console.error('Error fetching messages for chat:', error);
    res.status(500).json({ error: 'Failed to fetch messages for chat' });
  }
});

// POST /chats/:chatId/messages - Add a message to a chat - Protected
app.post('/chats/:chatId/messages', authenticateToken, (req: Request, res: Response) => {
  (async () => {
    const { chatId } = req.params;
    const { customerName, message } = req.body;
    if (!customerName || !message) {
      res.status(400).json({ error: 'customerName and message are required' });
      return;
    }
    const newMessage = {
      id: uuidv4(),
      chatId,
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
  })();
});

app.listen(port, () => {
  console.log(`Connectly backend listening on port ${port}`);
}); 