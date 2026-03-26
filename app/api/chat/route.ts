import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// JSON Server URL from environment
const JSON_SERVER_URL = process.env.RENDER_JSON_SERVER_URL || 'https://jsonserrver.onrender.com';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  edited: boolean;
  replyTo: string | null;
  user?: string;
}

interface ConvoEntry {
  id: string;
  user: string;
  userSays: string | string[];
}

// Helper function to parse JSON server response
function parseConvoResponse(data: unknown): ConvoEntry[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'convo' in data) {
    return (data as { convo: ConvoEntry[] }).convo;
  }
  return [];
}

// GET /api/chat - Get all chat messages from JSON server
export async function GET() {
  try {
    const response = await fetch(`${JSON_SERVER_URL}/convo`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from JSON server: ${response.status}`);
    }
    
    const data = await response.json();
    
    const convo = parseConvoResponse(data);
    
    // Convert each entry to a message
    const messages: ChatMessage[] = [];
    
    // IDs to skip (old/legacy/hardcoded entries)
    const skipIds = ['', 'olivia', 'msg-1', 'msg-2', 'msg-3', 'msg-4'];
    
    convo.forEach((entry, index) => {
      // Skip entries without required fields
      if (!entry.id || entry.id === '' || !entry.userSays) {
        return;
      }
      
      // Skip known hardcoded IDs
      if (skipIds.includes(entry.id)) {
        return;
      }
      
      // Handle both string and array formats for userSays
      const text = Array.isArray(entry.userSays) ? entry.userSays[0] : entry.userSays;
      
      if (text) {
        messages.push({
          id: entry.id,
          text: text,
          timestamp: index,
          edited: false,
          replyTo: null,
          user: entry.user || entry.id
        });
      }
    });
    
    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('[API/Chat] Error fetching chat from JSON server:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

// POST /api/chat - Send a new message (create a NEW entry for each message)
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

    // Check current count and clear if over 10000
    const countResponse = await fetch(`${JSON_SERVER_URL}/convo`);
    const countData = await countResponse.json();
    const convo = parseConvoResponse(countData);
    const currentCount = convo.filter(e => e.id && e.id !== '').length;
    
    if (currentCount >= 10000) {
      // Delete all non-empty entries one by one
      for (let i = convo.length - 1; i >= 0; i--) {
        if (convo[i].id && convo[i].id !== '') {
          await fetch(`${JSON_SERVER_URL}/convo/${i + 1}`, { method: 'DELETE' });
        }
      }
    }

    // Create a NEW entry - JSON server auto-generates unique ID
    // Use user as the 'user' field, and text as 'userSays'
    
    const postResponse = await fetch(`${JSON_SERVER_URL}/convo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: user.toLowerCase(),
        userSays: text
      })
    });

    if (!postResponse.ok) {
      throw new Error('Failed to create message on JSON server');
    }

    const createdEntry = await postResponse.json();

    // Get the auto-generated ID
    const newId = createdEntry.id || `msg-${Date.now()}`;

    // Create the new message response
    const newMessage: ChatMessage = {
      id: newId,
      text,
      timestamp: Date.now(),
      edited: false,
      replyTo: replyTo || null,
      user: user.toLowerCase()
    };

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('[API/Chat] Error sending message to JSON server:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PUT /api/chat - Edit a message
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { messageId, text } = body;

    if (!messageId || !text) {
      return NextResponse.json(
        { error: 'MessageId and text are required' },
        { status: 400 }
      );
    }

    // Fetch all entries
    const getResponse = await fetch(`${JSON_SERVER_URL}/convo`);
    const data = await getResponse.json();
    const convo = parseConvoResponse(data);

    // Find the entry with this ID
    const entryIndex = convo.findIndex(c => c.id === messageId);
    
    if (entryIndex < 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get old text - handle both string and array formats
    const oldUserSays = convo[entryIndex].userSays;
    const oldText = Array.isArray(oldUserSays) ? oldUserSays[0] : oldUserSays || '';
    const user = convo[entryIndex].user || convo[entryIndex].id;

    // PATCH to update userSays
    const patchResponse = await fetch(`${JSON_SERVER_URL}/convo/${entryIndex + 1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSays: text })  // Keep as string, not array
    });

    if (!patchResponse.ok) {
      throw new Error('Failed to update message on JSON server');
    }

    return NextResponse.json({
      id: messageId,
      text,
      originalText: oldText,
      edited: true,
      user
    });
  } catch (error) {
    console.error('[API/Chat] Error editing message:', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

// DELETE /api/chat - Delete a message
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const clearAll = searchParams.get('clearAll');

    // Special parameter to clear ALL messages
    if (clearAll === 'true') {
      const getResponse = await fetch(`${JSON_SERVER_URL}/convo`);
      const data = await getResponse.json();
      const convo = parseConvoResponse(data);
      
      // Delete all non-empty entries from the end
      for (let i = convo.length - 1; i >= 0; i--) {
        if (convo[i].id && convo[i].id !== '') {
          await fetch(`${JSON_SERVER_URL}/convo/${i + 1}`, { method: 'DELETE' });
        }
      }
      return NextResponse.json({ success: true, message: 'All messages cleared' });
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'MessageId is required' },
        { status: 400 }
      );
    }

    // Fetch all entries
    const getResponse = await fetch(`${JSON_SERVER_URL}/convo`);
    const data = await getResponse.json();
    const convo = parseConvoResponse(data);

    // Find the entry with this ID
    const entryIndex = convo.findIndex(c => c.id === messageId);
    
    if (entryIndex < 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // DELETE the specific entry (JSON Server uses 1-based index)
    const deleteResponse = await fetch(`${JSON_SERVER_URL}/convo/${entryIndex + 1}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete message from JSON server');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/Chat] Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}