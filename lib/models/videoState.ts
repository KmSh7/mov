import { getDatabase } from '../mongodb';

const VIDEO_STATE_COLLECTION = 'videoState';

/**
 * Video State interface representing the current state of the video player
 */
export interface VideoState {
  _id?: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: number;
  action: string;
}

/**
 * Get the current video state from MongoDB
 */
export async function getVideoState(): Promise<VideoState | null> {
  const db = await getDatabase();
  const collection = db.collection<VideoState>(VIDEO_STATE_COLLECTION);
  
  // Get the most recent state document (sorted by lastUpdatedAt descending)
  const state = await collection.findOne({}, { sort: { lastUpdatedAt: -1 } });
  
  
  return state;
}

/**
 * Create or update the video state in MongoDB
 */
export async function updateVideoState(state: Partial<VideoState>): Promise<VideoState> {
  const db = await getDatabase();
  const collection = db.collection<VideoState>(VIDEO_STATE_COLLECTION);
  
  const timestamp = Date.now();
  
  // Get current state to merge with new state
  const currentState = await getVideoState();
  
  const newState: VideoState = {
    currentTime: currentState?.currentTime ?? 0,
    isPlaying: currentState?.isPlaying ?? false,
    lastUpdatedBy: currentState?.lastUpdatedBy ?? '',
    lastUpdatedAt: timestamp,
    action: currentState?.action ?? '',
    ...state,
  };
  
  if (currentState?._id) {
    // Update existing document
    await collection.updateOne(
      { _id: currentState._id },
      { $set: newState }
    );
    return { ...newState, _id: currentState._id };
  } else {
    // Insert new document if none exists
    const result = await collection.insertOne(newState);
    return { ...newState, _id: result.insertedId.toString() };
  }
}

/**
 * Reset the video state to default values
 */
export async function resetVideoState(): Promise<VideoState> {
  const db = await getDatabase();
  const collection = db.collection<VideoState>(VIDEO_STATE_COLLECTION);
  
  const resetState: VideoState = {
    currentTime: 0,
    isPlaying: false,
    lastUpdatedBy: '',
    lastUpdatedAt: Date.now(),
    action: '',
  };
  
  // Get current state to check if document exists
  const currentState = await getVideoState();
  
  if (currentState?._id) {
    // Update existing document
    await collection.updateOne(
      { _id: currentState._id },
      { $set: resetState }
    );
    return { ...resetState, _id: currentState._id };
  } else {
    // Insert new document if none exists
    const result = await collection.insertOne(resetState);
    return { ...resetState, _id: result.insertedId.toString() };
  }
}

/**
 * Delete all video state documents (for cleanup)
 */
export async function deleteAllVideoStates(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection(VIDEO_STATE_COLLECTION);
  
  await collection.deleteMany({});
}