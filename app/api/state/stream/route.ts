import { NextResponse } from 'next/server';
import { getVideoState } from '@/lib/models/videoState';

export const dynamic = 'force-dynamic';

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
}

// GET /api/state/stream - Server-Sent Events for real-time updates
export async function GET() {
  
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);
      
      // Send initial state immediately from MongoDB
      getVideoState()
        .then(state => {
          const stateToSend = state || {
            currentTime: 0,
            isPlaying: false,
            lastUpdatedBy: '',
            lastUpdatedAt: Date.now(),
            action: ''
          };
          const data = `data: ${JSON.stringify(stateToSend)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        })
        .catch(error => {
          console.error('[STATE API] SSE: Error sending initial state:', error);
        });
      
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
      };
    },
    cancel() {
      // Client disconnected
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
