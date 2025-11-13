// Enhanced Voice Service with better error handling and reliability
class EnhancedVoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private maleVoice: SpeechSynthesisVoice | null = null;
  private lastProcessedText: string = '';
  private lastProcessedTime: number = 0;
  private processingLock: boolean = false;
  private silenceTimer: any = null;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 3;

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  private initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Optimized settings for better accuracy
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    
    let finalTranscript = '';
    
    this.recognition.onresult = (event: any) => {
      // Block if speaking or processing
      if (this.isSpeaking || this.processingLock) {
        return;
      }
      
      let interimTranscript = '';
      
      // Collect all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      const currentText = (finalTranscript + interimTranscript).trim();
      
      // Clear previous timer
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      
      // Adaptive wait time based on word count
      const wordCount = currentText.split(' ').filter(w => w.length > 0).length;
      const waitTime = wordCount >= 5 ? 1500 : 2500;
      
      this.silenceTimer = setTimeout(() => {
        if (!currentText || currentText.length < 3) {
          finalTranscript = '';
          return;
        }
        
        const now = Date.now();
        
        // Prevent duplicate processing
        if (currentText === this.lastProcessedText && (now - this.lastProcessedTime) < 10000) {
          finalTranscript = '';
          return;
        }
        
        // Process the text
        this.processingLock = true;
        this.lastProcessedText = currentText;
        this.lastProcessedTime = now;
        
        console.log('✅ Recognized:', currentText);
        
        if (this.onResultCallback) {
          this.onResultCallback(currentText);
        }
        
        finalTranscript = '';
        
        // Release lock after processing
        setTimeout(() => {
          this.processingLock = false;
        }, 5000);
      }, waitTime);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      
      if (event.error === 'network') {
        console.log('Network error - retrying...');
        this.restartRecognition();
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors
      } else if (event.error === 'aborted') {
        // Ignore aborted errors
      } else {
        this.processingLock = false;
      }
    };
    
    this.recognition.onend = () => {
      // Don't restart if speaking
      if (this.isSpeaking) {
        return;
      }
      
      // Auto-restart if still listening
      if (this.isListening && !this.processingLock) {
        this.restartRecognition();
      }
    };
  }

  private restartRecognition() {
    if (this.restartAttempts >= this.maxRestartAttempts) {
      console.log('Max restart attempts reached');
      this.restartAttempts = 0;
      return;
    }

    setTimeout(() => {
      if (!this.isSpeaking && this.isListening) {
        try {
          this.recognition.start();
          this.restartAttempts++;
          console.log(`🔄 Recognition restarted (attempt ${this.restartAttempts})`);
        } catch (error) {
          // Already started, ignore
        }
      }
    }, 500);
  }

  private initializeSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Load voices when they change
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;

    const voices = this.synthesis.getVoices();
    
    // Prefer male voices
    this.maleVoice = voices.find(v => 
      v.name.includes('Alex') || 
      v.name.includes('Daniel') ||
      v.name.includes('Fred') ||
      v.name.includes('Male')
    ) || voices.find(v => v.lang.includes('en-US')) || voices[0];
    
    if (this.maleVoice) {
      console.log('✅ Voice loaded:', this.maleVoice.name);
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve();
        return;
      }

      // Clean text - remove code, symbols, markdown
      let cleanText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/[<>{}[\]]/g, '') // Remove brackets
        .replace(/\n+/g, '. ') // Replace newlines with periods
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      // If text is too technical or has lots of symbols, summarize
      if (cleanText.length > 500 || /[{}()[\]<>]/g.test(cleanText)) {
        cleanText = "I've prepared a detailed response. Please check the screen for more information.";
      }

      // Mark as speaking
      this.isSpeaking = true;
      this.processingLock = true;

      // Stop recognition
      if (this.recognition) {
        try {
          this.recognition.abort();
          this.recognition.stop();
        } catch (e) {}
        this.isListening = false;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 0.95;
        utterance.volume = 1.0;

        if (this.maleVoice) {
          utterance.voice = this.maleVoice;
        }

        utterance.onend = () => {
          this.isSpeaking = false;

          // Wait before resuming listening
          setTimeout(() => {
            this.processingLock = false;
            this.isListening = true;
            this.restartAttempts = 0;

            // Restart recognition
            if (this.recognition) {
              try {
                this.recognition.start();
              } catch (e) {}
            }
          }, 1000); // Reduced from 2000ms

          resolve();
        };

        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          this.isSpeaking = false;
          this.processingLock = false;
          resolve();
        };

        try {
          this.synthesis!.speak(utterance);
        } catch (e) {
          console.error('Failed to speak:', e);
          this.isSpeaking = false;
          this.processingLock = false;
          resolve();
        }
      }, 100);
    });
  }

  startListening(onResult: (text: string) => void): void {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }
    
    this.onResultCallback = onResult;
    this.isListening = true;
    this.isSpeaking = false;
    this.processingLock = false;
    this.restartAttempts = 0;
    
    try {
      this.recognition.start();
      console.log('🎤 Listening started');
    } catch (error) {
      console.log('Recognition already started');
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
      this.isSpeaking = false;
      this.processingLock = false;
      this.restartAttempts = 0;
      console.log('🛑 Listening stopped');
    }
  }

  get listening(): boolean {
    return this.isListening;
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }
}

export const enhancedVoiceService = new EnhancedVoiceService();

