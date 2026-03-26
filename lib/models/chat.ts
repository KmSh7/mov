import { getDatabase } from '../mongodb';

const CHAT_COLLECTION = 'chats';

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  edited: boolean;
  replyTo: string | null;
  user: string;
}

/**
 * Get all chat messages from all users
 * Merges messages from all user chats
 */
export async function getAllMessages(): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const collection = db.collection<ChatMessage>(CHAT_COLLECTION);
  
  const messages = await collection.find({}).sort({ timestamp: 1 }).toArray();
  
  
  return messages;
}

/**
 * Add a new message to the chat
 */
export async function addMessage(user: string, text: string, replyTo?: string): Promise<ChatMessage> {
  const db = await getDatabase();
  const collection = db.collection<ChatMessage>(CHAT_COLLECTION);
  
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    text,
    timestamp: Date.now(),
    edited: false,
    replyTo: replyTo || null,
    user: user.toLowerCase(),
  };
  
  await collection.insertOne(newMessage);
  
  
  return newMessage;
}

/**
 * Edit an existing message
 */
export async function editMessage(messageId: string, newText: string): Promise<ChatMessage | null> {
  const db = await getDatabase();
  const collection = db.collection<ChatMessage>(CHAT_COLLECTION);
  
  const result = await collection.findOneAndUpdate(
    { id: messageId },
    { 
      $set: { 
        text: newText, 
        edited: true 
      } 
    },
    { returnDocument: 'after' }
  );
  
  
  return result;
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<ChatMessage>(CHAT_COLLECTION);
  
  const result = await collection.deleteOne({ id: messageId });
  
  
  return result.deletedCount > 0;
}

/**
 * Get messages by a specific user
 */
export async function getMessagesByUser(user: string): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const collection = db.collection<ChatMessage>(CHAT_COLLECTION);
  
  const messages = await collection
    .find({ user: user.toLowerCase() })
    .sort({ timestamp: 1 })
    .toArray();
  
  return messages;
}

/**
 * Clear all messages (for testing/reset)
 */
export async function clearAllMessages(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection(CHAT_COLLECTION);
  
  await collection.deleteMany({});
}

/**
 * Initialize chat with existing data from JSON files
 * This is a helper function to migrate existing data
 */
export async function initializeChatFromJSON(kumarMessages: ChatMessage[], oliviaMessages: ChatMessage[]): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<ChatMessage>(CHAT_COLLECTION);
  
  // Clear existing data first
  await collection.deleteMany({});
  
  // Add all messages with proper user field
  const messages = [
    ...kumarMessages.map(msg => ({ ...msg, user: 'kumar' })),
    ...oliviaMessages.map(msg => ({ ...msg, user: 'olivia' }))
  ];
  
  if (messages.length > 0) {
    await collection.insertMany(messages);
  }
}