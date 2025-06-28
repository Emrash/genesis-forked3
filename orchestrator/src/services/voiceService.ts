import axios from 'axios';
import { v4 as uuid } from 'uuid';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

/**
 * Service for voice synthesis capabilities
 */
class VoiceService {
  private client: any;
  
  constructor() {
    // Initialize ElevenLabs client if credentials are available
    if (ELEVENLABS_API_KEY) {
      try {
        const { ElevenLabs } = require('elevenlabs-node');
        this.client = new ElevenLabs(ELEVENLABS_API_KEY);
        console.log('🔊 ElevenLabs client initialized');
      } catch (error) {
        console.warn('⚠️ ElevenLabs Node SDK not available:', error);
        console.log('⚠️ Using HTTP client fallback for voice synthesis');
      }
    } else {
      console.log('⚠️ ElevenLabs API key not provided, will use agent service for voice synthesis');
    }
  }
  
  /**
   * Synthesize speech from text
   */
  async synthesizeSpeech(
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> {
    try {
      console.log(`🔊 Synthesizing speech: ${text.substring(0, 50)}...`);
      
      // If ElevenLabs client is available, use it directly
      if (this.client) {
        return await this.synthesizeDirectly(text, voiceId, options);
      }
      
      // Otherwise, use agent service
      return await this.synthesizeViaAgentService(text, voiceId, options);
    } catch (error: any) {
      console.error('❌ Speech synthesis failed:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }
  
  /**
   * Synthesize speech directly using ElevenLabs API
   */
  private async synthesizeDirectly(
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> {
    try {
      const voice = voiceId || ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      
      // Get voice settings if not provided
      let voiceSettings = {
        stability: options?.stability || 0.5,
        similarity_boost: options?.similarityBoost || 0.75,
        style: options?.style || 0.0,
        use_speaker_boost: options?.speakerBoost !== false
      };
      
      // Generate audio
      const audioBuffer = await this.client.generate({
        voice,
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: voiceSettings
      });
      
      // Convert to base64
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      
      // Convert to data URL for direct use in browsers
      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (error: any) {
      console.error('❌ Direct speech synthesis failed:', error);
      
      // Fall back to agent service if direct synthesis fails
      console.log('⚠️ Falling back to agent service for speech synthesis');
      return await this.synthesizeViaAgentService(text, voiceId, options);
    }
  }
  
  /**
   * Synthesize speech via the agent service
   */
  private async synthesizeViaAgentService(
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> {
    try {
      const response = await axios.post(`${AGENT_SERVICE_URL}/voice/synthesize`, {
        text,
        voice_id: voiceId,
        stability: options?.stability,
        similarity_boost: options?.similarityBoost,
        style: options?.style,
        use_speaker_boost: options?.speakerBoost
      });
      
      if (!response.data.audio) {
        throw new Error('No audio data received from agent service');
      }
      
      // Return as data URL
      return `data:audio/mpeg;base64,${response.data.audio}`;
    } catch (error: any) {
      console.error('❌ Agent service speech synthesis failed:', error);
      
      if (error.response) {
        throw new Error(`Agent service error: ${error.response.status} ${error.response.data?.error || error.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * List available voices
   */
  async listVoices(): Promise<any[]> {
    try {
      console.log('🔊 Listing available voices');
      
      // If ElevenLabs client is available, use it directly
      if (this.client) {
        const voicesData = await this.client.getVoices();
        return voicesData.voices;
      }
      
      // Otherwise, use agent service
      const response = await axios.get(`${AGENT_SERVICE_URL}/voice/voices`);
      return response.data.voices || [];
    } catch (error: any) {
      console.error('❌ Failed to list voices:', error);
      
      // Return mock voices if real ones can't be fetched
      return this.getMockVoices();
    }
  }
  
  /**
   * Get mock voices for development/fallback
   */
  private getMockVoices(): any[] {
    return [
      {
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        category: "premade",
        description: "A friendly and professional female voice"
      },
      {
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        category: "premade",
        description: "An authoritative and clear male voice"
      },
      {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        category: "premade",
        description: "A warm and engaging female voice"
      },
      {
        voice_id: "ErXwobaYiN019PkySvjV",
        name: "Antoni",
        category: "premade",
        description: "A confident and articulate male voice"
      }
    ];
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;