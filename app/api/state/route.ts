import { NextResponse } from 'next/server';
import { getVideoState, updateVideoState, resetVideoState } from '@/lib/models/videoState';
import { broadcastState } from './stream/route';

export const dynamic = 'force-dynamic';

// GET /api/state - Get current playback state from MongoDB
export async function GET() {
  try {
    const state = await getVideoState();
    
    if (!state) {
      // Return default state if none exists
      return NextResponse.json({
        currentTime: 0,
        isPlaying: false,
        lastUpdatedBy: '',
        lastUpdatedAt: Date.now(),
        action: ''
      });
    }
    
    return NextResponse.json(state);
  } catch (error) {
    console.error('[STATE API] GET Error reading state:', error);
    return NextResponse.json({ error: 'Failed to read state' }, { status: 500 });
  }
}

// POST /api/state - Update playback state in MongoDB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentTime, isPlaying, user, action } = body;
    

    // Update state in MongoDB
    const newState = await updateVideoState({
      currentTime: typeof currentTime === 'number' ? currentTime : undefined,
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : undefined,
      lastUpdatedBy: user || undefined,
      action: typeof action === 'string' ? action : undefined
    });
    

    // Broadcast to all connected SSE clients
    broadcastState(newState);

    return NextResponse.json(newState);
  } catch (error) {
    console.error('[STATE API] POST Error updating state:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}

// DELETE /api/state - Reset playback state in MongoDB
export async function DELETE() {
  try {
    
    const resetState = await resetVideoState();

    // Broadcast to all connected SSE clients
    broadcastState(resetState);

    return NextResponse.json(resetState);
  } catch (error) {
    console.error('[STATE API] DELETE Error resetting state:', error);
    return NextResponse.json({ error: 'Failed to reset state' }, { status: 500 });
  }
}
