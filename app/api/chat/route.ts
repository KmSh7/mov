import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  edited: boolean;
  replyTo: string | null;
}

// Paths to chat files
const kumarChatPath = path.join(process.cwd(), 'data', 'chat_kumar.json');
const oliviaChatPath = path.join(process.cwd(), 'data', 'chat_olivia.json');

// GET /api/chat - Get merged chat messages from both users
export async function GET() {
  try {
    // Read both chat files
    let kumarMessages: ChatMessage[] = [];
    let oliviaMessages: ChatMessage[] = [];

    try {
      const kumarContent = fs.readFileSync(kumarChatPath, 'utf-8');
      kumarMessages = JSON.parse(kumarContent);
    } catch (e) {
      // File might not exist yet
      kumarMessages = [];
    }

    try {
      const oliviaContent = fs.readFileSync(oliviaChatPath, 'utf-8');
      oliviaMessages = JSON.parse(oliviaContent);
    } catch (e) {
      oliviaMessages = [];
    }

    // Merge and sort by timestamp, adding user property
    const allMessages = [
      ...kumarMessages.map(msg => ({ ...msg, user: 'kumar' })),
      ...oliviaMessages.map(msg => ({ ...msg, user: 'olivia' }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json(allMessages);
  } catch (error) {
    console.error('Error reading chat:', error);
    return NextResponse.json({ error: 'Failed to read chat' }, { status: 500 });
  }
}

// POST /api/chat - Send a new message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, user, replyTo } = body;

    // Validate required fields
    if (!text || !user) {
      return NextResponse.json(
        { error: 'Text and user are required' },
        { status: 400 }
      );
    }

    // Determine which file to write to
    const isKumar = user.toLowerCase() === 'kumar';
    const filePath = isKumar ? kumarChatPath : oliviaChatPath;

    // Read existing messages
    let messages: ChatMessage[] = [];
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      messages = JSON.parse(fileContent);
    } catch (e) {
      messages = [];
    }

    // Create new message
    const newMessage = {
      id: `msg-${Date.now()}`,
      text,
      timestamp: Date.now(),
      edited: false,
      replyTo: replyTo || null
    };

    messages.push(newMessage);

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PUT /api/chat - Edit a message
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { messageId, text, user } = body;

    if (!messageId || !text || !user) {
      return NextResponse.json(
        { error: 'MessageId, text, and user are required' },
        { status: 400 }
      );
    }

    // Determine which file to check
    const isKumar = user.toLowerCase() === 'kumar';
    const filePath = isKumar ? kumarChatPath : oliviaChatPath;

    // Read messages
    let messages: ChatMessage[] = [];
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      messages = JSON.parse(fileContent);
    } catch (e) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Find and update message
    const messageIndex = messages.findIndex((m: ChatMessage) => m.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    messages[messageIndex].text = text;
    messages[messageIndex].edited = true;

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

    return NextResponse.json(messages[messageIndex]);
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

// DELETE /api/chat - Delete a message
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const user = searchParams.get('user');

    if (!messageId || !user) {
      return NextResponse.json(
        { error: 'MessageId and user are required' },
        { status: 400 }
      );
    }

    // Determine which file to check
    const isKumar = user.toLowerCase() === 'kumar';
    const filePath = isKumar ? kumarChatPath : oliviaChatPath;

    // Read messages
    let messages: ChatMessage[] = [];
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      messages = JSON.parse(fileContent);
    } catch (e) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Filter out the message
    const newMessages = messages.filter((m: ChatMessage) => m.id !== messageId);

    if (newMessages.length === messages.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(newMessages, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}