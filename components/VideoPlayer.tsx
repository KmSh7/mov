'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoPlayerProps {
  movieId: string;
  movieLink: string | null;
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
function getYouTubeEmbedUrl(url: string): string {
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
  
  return '';
}

// Helper function to convert Google Drive URL to embed URL
function getGoogleDriveEmbedUrl(url: string): string {
  if (!url) return '';
  
  // Already in embed format
  if (url.includes('drive.google.com/file/d/') && url.includes('/preview')) {
    return url;
  }
  
  // Extract file ID from various Google Drive URL formats
  let fileId = '';
  
  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  if (url.includes('drive.google.com/file/d/')) {
    fileId = url.split('drive.google.com/file/d/')[1]?.split('/')[0] || '';
  }
  // Format: https://drive.google.com/open?id=FILE_ID
  else if (url.includes('drive.google.com/open')) {
    const urlObj = new URL(url);
    fileId = urlObj.searchParams.get('id') || '';
  }
  
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return '';
}

// Helper function to get the appropriate embed URL based on the source
function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  // Check for Google Drive
  if (url.includes('drive.google.com')) {
    return getGoogleDriveEmbedUrl(url);
  }
  
  // Check for YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return getYouTubeEmbedUrl(url);
  }
  
  // Return as-is for other URLs (direct video links)
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isIframe, setIsIframe] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
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
    if (!movieLink) {
      setEmbedUrl('');
      setIsIframe(false);
      setIsYouTube(false);
      return;
    }
    const converted = getEmbedUrl(movieLink);
    setEmbedUrl(converted);
    // Check if it's an iframe embed (YouTube or Google Drive)
    const isYouTubeEmbed = converted.includes('youtube.com/embed');
    const isGoogleDriveEmbed = converted.includes('drive.google.com');
    setIsIframe(isYouTubeEmbed || isGoogleDriveEmbed);
    setIsYouTube(isYouTubeEmbed);
  }, [movieLink]);

  // Initialize YouTube IFrame API (only for YouTube embeds)
  useEffect(() => {
    if (!isYouTube || !embedUrl) return;

    if (typeof window !== 'undefined' && (window as unknown as { YT?: YouTubePlayer }).YT) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady = () => {
      
    };
  }, [isYouTube, embedUrl]);

  // Create player when embed URL is ready (only for YouTube embeds)
  useEffect(() => {
    if (!isYouTube || !embedUrl || !containerRef.current) return;

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
                
                playerReadyRef.current = true;
                setIsPlayerReady(true);
              },
              onStateChange: (_event: unknown) => {
                
                
                // Clear the flag immediately when any state change happens
                // This allows user actions to be synced even if a remote sync just happened
                const wasRemoteChange = isLocalChangeRef.current;
                isLocalChangeRef.current = false;
                
                // If this was a remote change (triggered by SSE), skip the sync
                if (wasRemoteChange) {
                  
                  return;
                }

                const typedEvent = _event as { data?: number };
                const state = typedEvent?.data;
                
                
                const isPlaying = state === YT_PLAYING;
                const isPaused = state === YT_PAUSED;
                const isBuffering = state === YT_BUFFERING;
                

                // Ignore buffering state - wait for actual play/pause
                if (isBuffering) {
                  
                  return;
                }

                if (isPlaying || isPaused) {
                  const currentTime = playerRef.current?.getCurrentTime() || 0;
                  
                  
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
                  
                  
                  syncState({ 
                    isPlaying, 
                    currentTime: Math.floor(currentTime),
                    action
                  });
                } else {
                  
                }
              }
            }
          });
        } catch (error) {
          
        }
      }
    }, 200);

    return () => clearInterval(checkApi);
  }, [isYouTube, embedUrl]);

  // Poll for state updates every 2 seconds (more reliable than SSE on Vercel)
  useEffect(() => {
    
    let pollInterval: NodeJS.Timeout | null = null;

    const pollState = async () => {
      try {
        const response = await fetch('/api/state');
        if (!response.ok) return;
        
        const state: PlaybackState = await response.json();
        
        

        if (state.lastUpdatedAt > localStateRef.current.lastUpdatedAt && state.lastUpdatedBy !== user) {
          

          setLocalState(state);

          prevStateRef.current = state;

          // Handle YouTube player sync
          if (playerRef.current && playerReadyRef.current) {
            const timeDiff = Math.abs(state.currentTime - (playerRef.current.getCurrentTime() || 0));
            
            
            
            // Get current player state
            const currentPlayerState = playerRef.current.getPlayerState();
            const currentlyPlaying = currentPlayerState === YT_PLAYING;
            

            // If remote state matches current player state, skip sync to avoid feedback loop
            const playerTime = playerRef.current.getCurrentTime() || 0;
            const timeMatch = Math.abs(state.currentTime - playerTime) < 2;
            const playStateMatch = state.isPlaying === currentlyPlaying;
            
            if (timeMatch && playStateMatch) {
              
              prevStateRef.current = state;
              setLocalState(state);
              return;
            }
            
            // Mark as local change BEFORE applying any remote changes
            // This prevents the onStateChange event from triggering another sync
            isLocalChangeRef.current = true;

            // If time diff < 10 seconds: it's okay, just sync play/pause (no seeking)
            if (timeDiff < 10) {
              
              
              if (state.isPlaying && !currentlyPlaying) {
                
                playerRef.current?.playVideo();
              } else if (!state.isPlaying && currentlyPlaying) {
                
                playerRef.current?.pauseVideo();
              } else {
                
              }
            } else {
              // Time diff >= 10 seconds: seek to match + sync play/pause
              
              setIsWaitingForSync(true);
              playerRef.current.seekTo(state.currentTime, true);

              setTimeout(() => {
                
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
          // Handle direct video URL sync (Cloudinary, etc.)
          else if (videoRef.current && !isIframe) {
            const timeDiff = Math.abs(state.currentTime - (videoRef.current.currentTime || 0));
            
            
            
            const currentlyPlaying = !videoRef.current.paused;
            

            // If remote state matches current player state, skip sync to avoid feedback loop
            const playerTime = videoRef.current.currentTime || 0;
            const timeMatch = Math.abs(state.currentTime - playerTime) < 2;
            const playStateMatch = state.isPlaying === currentlyPlaying;
            
            if (timeMatch && playStateMatch) {
              
              prevStateRef.current = state;
              setLocalState(state);
              return;
            }
            
            // Mark as local change BEFORE applying any remote changes
            isLocalChangeRef.current = true;

            // If time diff < 10 seconds: it's okay, just sync play/pause (no seeking)
            if (timeDiff < 10) {
              
              
              if (state.isPlaying && !currentlyPlaying) {
                
                videoRef.current.play();
              } else if (!state.isPlaying && currentlyPlaying) {
                
                videoRef.current.pause();
              } else {
                
              }
            } else {
              // Time diff >= 10 seconds: seek to match + sync play/pause
              
              setIsWaitingForSync(true);
              videoRef.current.currentTime = state.currentTime;

              setTimeout(() => {
                
                if (state.isPlaying) {
                  videoRef.current?.play();
                } else {
                  videoRef.current?.pause();
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
        console.error('[VideoPlayer] Poll: Error fetching state:', error);
      }
    };

    // Poll immediately, then every 2 seconds
    pollState();
    pollInterval = setInterval(pollState, 2000);

    return () => {
      
      if (pollInterval) {
        clearInterval(pollInterval);
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

      
    } catch (error) {
      
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
  if (!movieLink || movieLink === '') {
    return (
      <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
        <p className="text-gray-400">Loading video...</p>
      </div>
    );
  }

  if (!isIframe) {
    return (
      <div className="space-y-2">
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <video
              ref={videoRef}
              className="absolute top-0 left-0 w-full h-full"
              controls
              onPlay={() => syncState({ isPlaying: true, action: 'started playing' })}
              onPause={() => syncState({ isPlaying: false, action: 'paused' })}
              onTimeUpdate={(e) => {
                // Only sync time, preserve current play/pause state
                const currentTime = e.currentTarget.currentTime;
                const isPlaying = !e.currentTarget.paused;
                syncState({ 
                  currentTime, 
                  isPlaying,
                  action: isPlaying ? (localStateRef.current.isPlaying ? '' : 'started playing') : 'paused'
                });
              }}
            >
              <source src={movieLink} />
              Your browser does not support the video tag.
            </video>
          </div>

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

  // Render Google Drive embed as a regular iframe (styled like YouTube)
  if (isIframe && !isYouTube) {
    return (
      <div className="space-y-2">
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              frameBorder="0"
            />
          </div>

        </div>
        
        {/* Manual sync controls for Google Drive */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium">Google Drive Video</p>
              <p className="text-xs">Manual sync required (no auto-detection)</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => syncState({ isPlaying: true, action: 'started playing' })}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ▶ Play
              </button>
              <button
                onClick={() => syncState({ isPlaying: false, action: 'paused' })}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ⏸ Pause
              </button>
            </div>
          </div>
          
          {/* Current synced state */}
          {localStateRef.current.lastUpdatedBy && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {getActionDescription()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
        <div 
          id={playerId} 
          ref={containerRef}
          className="w-full aspect-video"
        />

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