'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoPlayerProps {
  movieId: string;
  movieLink: string;
  user: string;
}

interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: number;
  action?: string;
}

// Helper function to convert YouTube URL to embed URL
function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  if (url.includes('youtube.com/embed') || url.includes('youtu.be/embed')) {
    return url;
  }
  
  let videoId = '';
  
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    videoId = urlObj.searchParams.get('v') || '';
  } else if (url.includes('youtube.com/')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }
  
  return url;
}

// YouTube Player state constants
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;
const YT_CUED = 5;

// YouTube API types
interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  addEventListener: (event: string, callback: (event: unknown) => void) => void;
}

// Format time as MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({ movieLink, user }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isIframe, setIsIframe] = useState(false);
  const [localState, setLocalState] = useState<PlaybackState>({
    currentTime: 0,
    isPlaying: false,
    lastUpdatedBy: '',
    lastUpdatedAt: 0,
    action: ''
  });
  // Use ref for quick access to latest state - avoids stale closure issues
  const localStateRef = useRef<PlaybackState>(localState);
  useEffect(() => {
    localStateRef.current = localState;
  }, [localState]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWaitingForSync, setIsWaitingForSync] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const isLocalChangeRef = useRef(false);
  const playerReadyRef = useRef(false);
  const prevStateRef = useRef<PlaybackState>({ currentTime: 0, isPlaying: false, lastUpdatedBy: '', lastUpdatedAt: 0, action: '' });

  // Convert URL to embed format
  useEffect(() => {
    const converted = getEmbedUrl(movieLink);
    setEmbedUrl(converted);
    setIsIframe(converted.includes('youtube.com/embed'));
  }, [movieLink]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!isIframe || !embedUrl) return;

    if (typeof window !== 'undefined' && (window as unknown as { YT?: YouTubePlayer }).YT) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady = () => {
      console.log('[VideoPlayer] YouTube API ready');
    };
  }, [isIframe, embedUrl]);

  // Create player when embed URL is ready
  useEffect(() => {
    if (!isIframe || !embedUrl || !containerRef.current) return;

    const videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
    if (!videoId) return;

    const checkApi = setInterval(() => {
      const YT = window as unknown as { YT?: { Player: new (el: string, config: object) => YouTubePlayer } };
      if (typeof YT !== 'undefined' && YT.YT && typeof YT.YT.Player === 'function') {
        clearInterval(checkApi);

        try {
          playerRef.current = new YT.YT!.Player(containerRef.current!.id || 'youtube-player', {
            videoId,
            playerVars: {
              enablejsapi: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              fs: 1,
              iv_load_policy: 3,
            },
            events: {
              onReady: (_event: unknown) => {
                console.log('[VideoPlayer] Player ready for user:', user);
                playerReadyRef.current = true;
                setIsPlayerReady(true);
              },
              onStateChange: (_event: unknown) => {
                console.log('[VideoPlayer] onStateChange fired for user:', user, 'event:', _event);
                
                // Clear the flag immediately when any state change happens
                // This allows user actions to be synced even if a remote sync just happened
                const wasRemoteChange = isLocalChangeRef.current;
                isLocalChangeRef.current = false;
                
                // If this was a remote change (triggered by SSE), skip the sync
                if (wasRemoteChange) {
                  console.log('[VideoPlayer] Skipping sync - this was a remote change');
                  return;
                }

                const typedEvent = _event as { data?: number };
                const state = typedEvent?.data;
                console.log('[VideoPlayer] Player state:', state, 'YT_PLAYING:', YT_PLAYING, 'YT_PAUSED:', YT_PAUSED, 'YT_BUFFERING:', YT_BUFFERING);
                
                const isPlaying = state === YT_PLAYING;
                const isPaused = state === YT_PAUSED;
                const isBuffering = state === YT_BUFFERING;
                console.log('[VideoPlayer] isPlaying:', isPlaying, 'isPaused:', isPaused, 'isBuffering:', isBuffering);

                // Ignore buffering state - wait for actual play/pause
                if (isBuffering) {
                  console.log('[VideoPlayer] Ignoring buffering state - waiting for stable state');
                  return;
                }

                if (isPlaying || isPaused) {
                  const currentTime = playerRef.current?.getCurrentTime() || 0;
                  console.log('[VideoPlayer] Current time:', currentTime);
                  
                  // Determine action description
                  let action = '';
                  if (isPlaying) {
                    if (!prevStateRef.current.isPlaying) {
                      action = 'started playing';
                    } else if (Math.abs(currentTime - prevStateRef.current.currentTime) > 5) {
                      action = `skipped to ${formatTime(currentTime)}`;
                    }
                  } else if (isPaused) {
                    action = 'paused';
                  }
                  
                  prevStateRef.current = { 
                    ...prevStateRef.current, 
                    isPlaying, 
                    currentTime,
                    action
                  };
                  
                  console.log('[VideoPlayer] Local player event:', action || (isPlaying ? 'playing' : 'paused'), 'at', currentTime, 'user:', user);
                  syncState({ 
                    isPlaying, 
                    currentTime: Math.floor(currentTime),
                    action
                  });
                } else {
                  console.log('[VideoPlayer] Ignoring non-play/pause state:', state);
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating player:', error);
        }
      }
    }, 200);

    return () => clearInterval(checkApi);
  }, [isIframe, embedUrl]);

  // Poll for state updates every 1 second
  useEffect(() => {
    console.log('[VideoPlayer] Starting SSE connection for user:', user);
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/state/stream');
      console.log('[VideoPlayer] SSE: EventSource created');

      eventSource.onopen = () => {
        console.log('[VideoPlayer] SSE: Connection opened');
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const state: PlaybackState = JSON.parse(event.data);
          console.log('[VideoPlayer] SSE: Received state:', JSON.stringify(state));
          console.log('[VideoPlayer] SSE: Comparing - lastUpdatedAt:', state.lastUpdatedAt, 'local lastUpdatedAt:', localStateRef.current.lastUpdatedAt, 'lastUpdatedBy:', state.lastUpdatedBy, 'current user:', user);

          if (state.lastUpdatedAt > localStateRef.current.lastUpdatedAt && state.lastUpdatedBy !== user) {
            console.log('[VideoPlayer] SSE: Remote state update detected - will sync! Old:', JSON.stringify(localStateRef.current), 'New:', JSON.stringify(state));

            setLocalState(state);

            prevStateRef.current = state;

            if (playerRef.current && playerReadyRef.current) {
              const timeDiff = Math.abs(state.currentTime - (playerRef.current.getCurrentTime() || 0));
              console.log('[VideoPlayer] SSE: Time diff:', timeDiff);
              console.log('[VideoPlayer] SSE: Remote isPlaying:', state.isPlaying);
              
              // Get current player state
              const currentPlayerState = playerRef.current.getPlayerState();
              const currentlyPlaying = currentPlayerState === YT_PLAYING;
              console.log('[VideoPlayer] SSE: Current player state:', currentPlayerState, 'YT_PLAYING:', YT_PLAYING, 'currentlyPlaying:', currentlyPlaying);

              // Mark as local change BEFORE applying any remote changes
              // This prevents the onStateChange event from triggering another sync
              isLocalChangeRef.current = true;

              // If time diff < 10 seconds: it's okay, just sync play/pause (no seeking)
              if (timeDiff < 10) {
                console.log('[VideoPlayer] SSE: Time diff < 10s - syncing play/pause only');
                
                if (state.isPlaying && !currentlyPlaying) {
                  console.log('[VideoPlayer] SSE: Calling playVideo()');
                  playerRef.current?.playVideo();
                } else if (!state.isPlaying && currentlyPlaying) {
                  console.log('[VideoPlayer] SSE: Calling pauseVideo()');
                  playerRef.current?.pauseVideo();
                } else {
                  console.log('[VideoPlayer] SSE: No play/pause change needed');
                }
              } else {
                // Time diff >= 10 seconds: seek to match + sync play/pause
                console.log('[VideoPlayer] SSE: Time diff >= 10s - seeking to match');
                setIsWaitingForSync(true);
                playerRef.current.seekTo(state.currentTime, true);

                setTimeout(() => {
                  console.log('[VideoPlayer] SSE: After seek - syncing play/pause. Remote isPlaying:', state.isPlaying);
                  if (state.isPlaying) {
                    playerRef.current?.playVideo();
                  } else {
                    playerRef.current?.pauseVideo();
                  }
                  setIsWaitingForSync(false);
                }, 500);
              }
              
              // Reset local change flag after a delay to let player state stabilize
              setTimeout(() => {
                isLocalChangeRef.current = false;
              }, 1000);
            }
          }
        } catch (error) {
          console.error('[VideoPlayer] SSE: Error parsing state:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[VideoPlayer] SSE: Error:', error);
        eventSource?.close();
        
        // Reconnect after 2 seconds
        if (!reconnectTimeout) {
          console.log('[VideoPlayer] SSE: Reconnecting in 2 seconds...');
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connectSSE();
          }, 2000);
        }
      };
    };

    connectSSE();

    return () => {
      console.log('[VideoPlayer] SSE: Cleaning up');
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [localState.lastUpdatedAt, user]);

  // Handle state sync to server
  const syncState = useCallback(async (newState: Partial<PlaybackState>) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newState,
          user
        })
      });
      const updatedState = await response.json();

      isLocalChangeRef.current = true;
      setLocalState(updatedState);

      console.log('[VideoPlayer] Synced state to server:', updatedState);
    } catch (error) {
      console.error('[VideoPlayer] Error syncing state to server:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Get action description
  const getActionDescription = () => {
    if (!localStateRef.current.lastUpdatedBy) return '';
    
    const isMe = localStateRef.current.lastUpdatedBy === user;
    const userName = isMe ? 'You' : (localStateRef.current.lastUpdatedBy.charAt(0).toUpperCase() + localStateRef.current.lastUpdatedBy.slice(1));
    
    if (localStateRef.current.action) {
      return `${userName} ${localStateRef.current.action}`;
    }
    
    return localStateRef.current.isPlaying 
      ? `${userName} is playing` 
      : `${userName} paused`;
  };

  // For non-iframe videos (direct video URLs)
  if (!isIframe) {
    return (
      <div className="space-y-2">
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            className="w-full aspect-video"
            controls
            onPlay={() => syncState({ isPlaying: true, action: 'started playing' })}
            onPause={() => syncState({ isPlaying: false, action: 'paused' })}
            onTimeUpdate={(e) => syncState({ currentTime: e.currentTarget.currentTime })}
          >
            <source src={movieLink} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {(isSyncing || isWaitingForSync) && (
            <div className="absolute top-4 right-4 bg-orange-500/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
              <span className="animate-spin">⟳</span>
              {isWaitingForSync ? 'Syncing...' : 'Saving...'}
            </div>
          )}
        </div>
        
        {/* Status below video */}
        {localStateRef.current.lastUpdatedBy && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {getActionDescription()}
          </div>
        )}
      </div>
    );
  }

  const playerId = `youtube-player-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
        <div 
          id={playerId} 
          ref={containerRef}
          className="w-full aspect-video"
        />

        {(isSyncing || isWaitingForSync) && (
          <div className="absolute top-4 right-4 bg-orange-500/90 text-white text-xs px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <span className="animate-spin">⟳</span>
            {isWaitingForSync ? 'Syncing video...' : 'Saving...'}
          </div>
        )}
      </div>
      
      {/* Status below video */}
      {localStateRef.current.lastUpdatedBy && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {getActionDescription()}
        </div>
      )}
    </div>
  );
}