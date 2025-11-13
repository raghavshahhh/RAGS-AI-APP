interface UserActivity {
  movement: boolean;
  gesture: string;
  speaking: boolean;
  lookingAway: boolean;
  idle: boolean;
}

class ProactiveAssistant {
  private lastActivity: number = Date.now();
  private lastQuestion: number = 0;
  private isWatching: boolean = true;
  private userName: string = 'Sir';
  private onProactiveMessage?: (message: string) => void;

  constructor() {
    const config = localStorage.getItem('ragsConfig');
    if (config) {
      const parsed = JSON.parse(config);
      this.userName = parsed.userName || 'Sir';
    }
  }

  setMessageCallback(callback: (message: string) => void) {
    this.onProactiveMessage = callback;
  }

  analyzeActivity(activity: UserActivity) {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const timeSinceLastQuestion = now - this.lastQuestion;

    // Update last activity
    if (activity.movement || activity.speaking || activity.gesture !== 'none') {
      this.lastActivity = now;
    }

    // Proactive questions (every 30 seconds if active)
    if (timeSinceLastQuestion > 30000 && timeSinceLastActivity < 5000) {
      this.askProactiveQuestion(activity);
      this.lastQuestion = now;
    }

    // Idle detection (2 minutes)
    if (timeSinceLastActivity > 120000 && !activity.idle) {
      this.sendMessage(`${this.userName}, sab theek hai? Kuch help chahiye?`);
      this.lastQuestion = now;
    }

    // Gesture-based questions
    if (activity.gesture === 'thumbs_up') {
      this.sendMessage('Great! Kuch aur help chahiye?');
      this.lastQuestion = now;
    } else if (activity.gesture === 'pointing') {
      this.sendMessage(`${this.userName}, kya dekhna chahte ho? Main help kar sakta hoon.`);
      this.lastQuestion = now;
    }
  }

  private askProactiveQuestion(activity: UserActivity) {
    const questions = [
      `${this.userName}, kya kar rahe ho? Kuch help chahiye?`,
      `${this.userName}, main kuch help kar sakta hoon?`,
      `Koi kaam hai ${this.userName}? Main ready hoon.`,
      `${this.userName}, kuch sochne mein help karu?`,
      `Kya search karna hai ${this.userName}?`,
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    this.sendMessage(randomQuestion);
  }

  handleVoiceCommand(text: string): boolean {
    const lower = text.toLowerCase();

    // Stop/Mute commands
    if (lower.match(/\b(ruko|stop|wait|chup|mute|quiet)\b/)) {
      this.isWatching = false;
      this.sendMessage('Ji, main chup hoon. Bulao jab zarurat ho.');
      return true;
    }

    // Resume commands
    if (lower.match(/\b(chalo|start|speak|bolo|unmute)\b/)) {
      this.isWatching = true;
      this.sendMessage(`Ji ${this.userName}, main wapas active hoon!`);
      return true;
    }

    return false;
  }

  private sendMessage(message: string) {
    if (this.isWatching && this.onProactiveMessage) {
      this.onProactiveMessage(message);
    }
  }

  isActive(): boolean {
    return this.isWatching;
  }

  setActive(active: boolean) {
    this.isWatching = active;
  }
}

export const proactiveAssistant = new ProactiveAssistant();
