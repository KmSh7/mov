import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Path to state.json file
const stateFilePath = path.join(process.cwd(), 'data', 'state.json');

// Keep track of all connected SSE clients - SHARED with state route
const clients: Set<ReadableStreamDefaultController> = new Set();

// Export broadcast function for use by state route
export function broadcastState(state: object) {
  const data = `data: ${JSON.stringify(state)}\n\n`;
  const encodedData = new TextEncoder().encode(data);
  
  clients.forEach(controller => {
    try {
      controller.enqueue(encodedData);
    } catch (error) {
      // Client probably disconnected, remove it
      clients.delete(controller);
    }
  });
  console.log('[STATE API] SSE: Broadcast to', clients.size, 'clients');
}

// GET /api/state/stream - Server-Sent Events for real-time updates
export async function GET() {
  console.log('[STATE API] SSE: New client connected');
  
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);
      console.log('[STATE API] SSE: Client added, total clients:', clients.size);
      
      // Send initial state immediately
      try {
        const fileContent = fs.readFileSync(stateFilePath, 'utf-8');
        const state = JSON.parse(fileContent);
        const data = `data: ${JSON.stringify(state)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
        console.log('[STATE API] SSE: Sent initial state to new client');
      } catch (error) {
        console.error('[STATE API] SSE: Error sending initial state:', error);
      }
      
      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch (error) {
          // Client disconnected
          clearInterval(heartbeat);
        }
      }, 15000);
      
      // Cleanup on abort
      return () => {
        clearInterval(heartbeat);
        clients.delete(controller);
        console.log('[STATE API] SSE: Client disconnected, remaining clients:', clients.size);
      };
    },
    cancel() {
      // Client disconnected
      console.log('[STATE API] SSE: Client cancelled connection');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}


