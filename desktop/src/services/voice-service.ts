class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private maleVoice: any = null;
  private lastProcessedText: string = '';
  private lastProcessedTime: number = 0;
  private processingLock: boolean = false;

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // CRITICAL: Continuous mode with interim results to collect full sentence
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      let finalTranscript = '';
      let silenceTimer: any = null;
      
      this.recognition.onresult = (event: any) => {
        // CRITICAL: ALWAYS ignore if speaking
        if (this.isSpeaking) {
          // Blocked - speaking
          // Stop recognition immediately
          try {
            this.recognition.stop();
          } catch (e) {}
          return;
        }
        
        // CRITICAL: Ignore if processing
        if (this.processingLock) {
          // Blocked - processing
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
        if (silenceTimer) clearTimeout(silenceTimer);
        
        // Wait for 2 seconds of silence OR minimum 5 words
        const wordCount = currentText.split(' ').length;
        const waitTime = wordCount >= 5 ? 1500 : 2500;
        
        silenceTimer = setTimeout(() => {
          if (!currentText || currentText.length < 5) {
            finalTranscript = '';
            return;
          }
          
          const now = Date.now();
          
          // Check duplicate
          if (currentText === this.lastProcessedText && (now - this.lastProcessedTime) < 10000) {
            finalTranscript = '';
            return;
          }
          
          // Process
          this.processingLock = true;
          this.lastProcessedText = currentText;
          this.lastProcessedTime = now;
          
          if (this.onResultCallback) {
            this.onResultCallback(currentText);
          }
          
          finalTranscript = '';
          
          // Release lock after 5 seconds
          setTimeout(() => {
            this.processingLock = false;
          }, 5000);
        }, waitTime);
      };
      
      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('❌ Speech error:', event.error);
        }
        this.processingLock = false;
      };
      
      this.recognition.onend = () => {
        // CRITICAL: NEVER restart if speaking
        if (this.isSpeaking) {
          return;
        }
        
        // Only restart if listening and not processing
        if (this.isListening && !this.processingLock) {
          setTimeout(() => {
            // Double check not speaking
            if (!this.isSpeaking) {
              try {
                this.recognition.start();
              } catch (error) {}
            }
          }, 500);
        }
      };
    }
    
    this.loadMaleVoice();
  }
  
  private loadMaleVoice() {
    const setVoice = () => {
      const voices = speechSynthesis.getVoices();
      this.maleVoice = voices.find(v => 
        v.name.includes('Alex') || 
        v.name.includes('Daniel') ||
        v.name.includes('Fred')
      ) || voices.find(v => v.lang.includes('en-US'));
      // Voice loaded
    };
    
    if (speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      speechSynthesis.onvoiceschanged = setVoice;
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      
      // Speaking...
      
      // Mark as speaking
      this.isSpeaking = true;
      this.processingLock = true;
      
      // FORCE stop recognition - multiple attempts
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
        
        try {
          this.recognition.stop();
        } catch (e) {}
        
        // Set flag to prevent restart
        this.isListening = false;
      }
      
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Wait a bit for cancel to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.85;
        utterance.volume = 1.0;
        
        // Load voice if not loaded
        if (!this.maleVoice) {
          this.loadMaleVoice();
        }
        
        if (this.maleVoice) {
          utterance.voice = this.maleVoice;
        }
        
        utterance.onend = () => {
          this.isSpeaking = false;
          
          // Wait 3 seconds before resuming
          setTimeout(() => {
            this.processingLock = false;
            
            // Re-enable listening
            this.isListening = true;
            
            // Restart recognition
            if (this.recognition) {
              try {
                this.recognition.start();
              } catch (e) {}
            }
          }, 3000);
          
          resolve();
        };
        
        utterance.onerror = (e) => {
          this.isSpeaking = false;
          this.processingLock = false;
          resolve();
        };
        
        try {
          speechSynthesis.speak(utterance);
        } catch (e) {
          this.isSpeaking = false;
          this.processingLock = false;
          resolve();
        }
      }, 100);
    });
  }

  startListening(onResult: (text: string) => void): void {
    if (!this.recognition) {
      return;
    }
    this.onResultCallback = onResult;
    this.isListening = true;
    this.isSpeaking = false;
    this.processingLock = false;
    
    try {
      this.recognition.start();
    } catch (error) {}
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
      this.isSpeaking = false;
      this.processingLock = false;
    }
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();
