import { useState, useEffect, useCallback } from 'react';
import { videoService, Avatar } from '../services/videoService';

/**
 * Hook for video generation and management
 */
export function useVideo() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  
  // Load available avatars
  useEffect(() => {
    loadAvatars();
  }, []);
  
  // Load available avatars
  const loadAvatars = async () => {
    setError(null);
    
    try {
      const availableAvatars = await videoService.listAvatars();
      setAvatars(availableAvatars);
      
      // Set default avatar if available
      if (availableAvatars.length > 0 && !selectedAvatar) {
        setSelectedAvatar(availableAvatars[0]);
      }
    } catch (err: any) {
      console.error('Failed to load avatars:', err);
      setError(err.message || 'Failed to load available avatars');
    }
  };
  
  // Select an avatar
  const selectAvatar = useCallback((avatar: Avatar | string) => {
    if (typeof avatar === 'string') {
      const avatarObj = avatars.find(a => a.id === avatar);
      if (avatarObj) {
        setSelectedAvatar(avatarObj);
      }
    } else {
      setSelectedAvatar(avatar);
    }
  }, [avatars]);
  
  // Generate video from text
  const generateVideo = useCallback(async (
    text: string,
    options?: {
      avatarId?: string;
      webhookUrl?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!text) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);
    setGeneratedVideo(null);
    
    try {
      const avatarId = options?.avatarId || selectedAvatar?.id;
      if (!avatarId) {
        throw new Error('No avatar selected');
      }
      
      const result = await videoService.generateVideo(text, {
        avatarId,
        webhookUrl: options?.webhookUrl,
        metadata: options?.metadata
      });
      
      if (result.success && result.video) {
        setVideoId(result.video.id);
        
        // Start polling for video status
        startPolling(result.video.id);
        
        // Return video ID for external tracking
        return result.video.id;
      } else {
        throw new Error(result.error || 'Video generation failed');
      }
    } catch (err: any) {
      console.error('Video generation failed:', err);
      setError(err.message || 'Failed to generate video');
      setIsGenerating(false);
      throw err;
    }
  }, [selectedAvatar]);
  
  // Start polling for video status
  const startPolling = useCallback(async (id: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes at 5-second intervals
    const pollInterval = 5000; // 5 seconds
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setError('Video generation timed out');
        setIsGenerating(false);
        return;
      }
      
      try {
        const status = await videoService.getVideoStatus(id);
        
        // Update progress based on status
        if (status.status === 'processing') {
          setGenerationProgress(status.progress || Math.min(95, attempts * 2));
          
          // Continue polling
          setTimeout(checkStatus, pollInterval);
        } else if (status.status === 'completed' && status.url) {
          setGeneratedVideo(status.url);
          setGenerationProgress(100);
          setIsGenerating(false);
        } else if (status.status === 'failed') {
          setError(status.error || 'Video generation failed');
          setIsGenerating(false);
        }
      } catch (err: any) {
        console.error('Failed to check video status:', err);
        // Continue polling despite error
        setTimeout(checkStatus, pollInterval);
      }
      
      attempts++;
    };
    
    // Start polling
    setTimeout(checkStatus, pollInterval);
  }, []);
  
  // Cancel video generation
  const cancelGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationProgress(0);
    setVideoId(null);
  }, []);
  
  return {
    avatars,
    selectedAvatar,
    isGenerating,
    generationProgress,
    generatedVideo,
    error,
    videoId,
    loadAvatars,
    selectAvatar,
    generateVideo,
    cancelGeneration
  };
}