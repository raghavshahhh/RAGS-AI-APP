import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

interface WhisperResponse {
  text: string;
  language?: string;
  duration?: number;
}

export class WhisperService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  /**
   * Transcribe audio file to text using OpenAI Whisper
   */
  async transcribe(audioPath: string, language?: string): Promise<WhisperResponse> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioPath));
      formData.append('model', 'whisper-1');
      
      if (language) {
        formData.append('language', language);
      }

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        text: response.data.text,
        language: response.data.language,
        duration: response.data.duration,
      };
    } catch (error: any) {
      console.error('Whisper transcription error:', error.response?.data || error.message);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribeBuffer(audioBuffer: Buffer, filename: string = 'audio.wav'): Promise<WhisperResponse> {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, filename);
      formData.append('model', 'whisper-1');

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return {
        text: response.data.text,
        language: response.data.language,
        duration: response.data.duration,
      };
    } catch (error: any) {
      console.error('Whisper transcription error:', error.response?.data || error.message);
      throw new Error('Failed to transcribe audio buffer');
    }
  }

  /**
   * Translate audio to English
   */
  async translate(audioPath: string): Promise<WhisperResponse> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioPath));
      formData.append('model', 'whisper-1');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/translations',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        text: response.data.text,
      };
    } catch (error: any) {
      console.error('Whisper translation error:', error.response?.data || error.message);
      throw new Error('Failed to translate audio');
    }
  }
}

export const whisperService = new WhisperService();

