class ContextAwarenessService {
  async analyzeContext(data: {
    userPosition: { x: number; y: number };
    gesture: string;
    handPosition: any;
    cameraFrame?: string;
  }): Promise<string> {
    const insights: string[] = [];

    // Position analysis
    if (Math.abs(data.userPosition.x) > 0.5) {
      insights.push('User is looking to the side');
    }
    if (data.userPosition.y > 0.5) {
      insights.push('User is looking down');
    } else if (data.userPosition.y < -0.5) {
      insights.push('User is looking up');
    }

    // Gesture analysis
    if (data.gesture === 'thumbs_up') {
      insights.push('User showing approval');
    } else if (data.gesture === 'pointing') {
      insights.push('User pointing at something');
    } else if (data.gesture === 'peace') {
      insights.push('User showing peace sign');
    }

    // Hand position
    if (data.handPosition) {
      insights.push('User hand is active');
    }

    return insights.join(', ') || 'User is attentive';
  }

  generateProactiveQuestion(context: string): string {
    if (context.includes('looking to the side')) {
      return 'Kya dekh rahe ho? Main help kar sakta hoon?';
    }
    if (context.includes('looking down')) {
      return 'Kuch padh rahe ho? Ya kuch search karu?';
    }
    if (context.includes('approval')) {
      return 'Great! Aur kuch chahiye?';
    }
    if (context.includes('pointing')) {
      return 'Kya dikhana chahte ho? Main samajh sakta hoon.';
    }

    return 'Sir, kuch help chahiye?';
  }
}

export const contextAwareness = new ContextAwarenessService();
