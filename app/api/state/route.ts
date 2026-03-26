import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { broadcastState } from './stream/route';

export const dynamic = 'force-dynamic';

// Path to state.json file
const stateFilePath = path.join(process.cwd(), 'data', 'state.json');

// GET /api/state - Get current playback state
export async function GET() {
  try {
    console.log('[STATE API] GET request received');
    const fileContent = fs.readFileSync(stateFilePath, 'utf-8');
    const state = JSON.parse(fileContent);
    console.log('[STATE API] GET returning state:', JSON.stringify(state));
    return NextResponse.json(state);
  } catch (error) {
    console.error('[STATE API] GET Error reading state:', error);
    return NextResponse.json({ error: 'Failed to read state' }, { status: 500 });
  }
}

// POST /api/state - Update playback state
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentTime, isPlaying, user, action } = body;
    
    console.log('[STATE API] POST request received:', { currentTime, isPlaying, user, action });

    // Read current state
    const fileContent = fs.readFileSync(stateFilePath, 'utf-8');
    const state = JSON.parse(fileContent);
    console.log('[STATE API] Current state before update:', JSON.stringify(state));

    // Always allow updates from different users (no conflict check needed for sync)
    const timestamp = Date.now();
    // Update state
    const newState = {
      currentTime: typeof currentTime === 'number' ? currentTime : state.currentTime,
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : state.isPlaying,
      lastUpdatedBy: user || state.lastUpdatedBy,
      lastUpdatedAt: timestamp,
      action: typeof action === 'string' ? action : state.action || ''
    };
    
    console.log('[STATE API] New state to write:', JSON.stringify(newState));

    // Write back to file
    fs.writeFileSync(stateFilePath, JSON.stringify(newState, null, 2));
    console.log('[STATE API] State written to file successfully');

    // Broadcast to all connected SSE clients
    broadcastState(newState);

    return NextResponse.json(newState);
  } catch (error) {
    console.error('[STATE API] POST Error updating state:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}

// DELETE /api/state - Reset playback state
export async function DELETE() {
  try {
    console.log('[STATE API] DELETE request received - resetting state');
    const resetState = {
      currentTime: 0,
      isPlaying: false,
      lastUpdatedBy: '',
      lastUpdatedAt: Date.now(),
      action: ''
    };

    fs.writeFileSync(stateFilePath, JSON.stringify(resetState, null, 2));
    console.log('[STATE API] State reset successfully');

    // Broadcast to all connected SSE clients
    broadcastState(resetState);

    return NextResponse.json(resetState);
  } catch (error) {
    console.error('[STATE API] DELETE Error resetting state:', error);
    return NextResponse.json({ error: 'Failed to reset state' }, { status: 500 });
  }
}

// Broadcast state to all connected SSE clients
// Now using the shared broadcastState from stream/route.ts
