// ============================================================================
// FACE DETECTION - Detect and recognize users
// ============================================================================

import * as fs from 'fs/promises';
import * as path from 'path';

interface FaceData {
  userId: string;
  name: string;
  lastSeen: Date;
  greetingCount: number;
}

interface DetectionResult {
  detected: boolean;
  userId?: string;
  name?: string;
  confidence: number;
}

export class FaceDetection {
  private dataDir: string;
  private knownFaces: Map<string, FaceData> = new Map();
  private enabled: boolean = true;

  constructor() {
    const homeDir = process.env.HOME || '';
    this.dataDir = path.join(homeDir, '.rags', 'faces');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadKnownFaces();
      console.log('✅ Face detection initialized');
    } catch (error) {
      console.error('Face detection init failed:', error);
    }
  }

  /**
   * Detect face in image
   */
  async detectFace(imagePath: string): Promise<DetectionResult> {
    if (!this.enabled) {
      return { detected: false, confidence: 0 };
    }

    try {
      console.log('👤 Detecting face...');

      // TODO: Implement actual face detection with @mediapipe/face_detection
      // For now, return mock detection
      
      // Check if any known faces exist
      if (this.knownFaces.size > 0) {
        const firstFace = Array.from(this.knownFaces.values())[0];
        
        // Update last seen
        firstFace.lastSeen = new Date();
        firstFace.greetingCount++;
        await this.saveKnownFaces();

        console.log(`✅ Face detected: ${firstFace.name}`);
        
        return {
          detected: true,
          userId: firstFace.userId,
          name: firstFace.name,
          confidence: 0.85
        };
      }

      return { detected: false, confidence: 0 };
    } catch (error) {
      console.error('Face detection failed:', error);
      return { detected: false, confidence: 0 };
    }
  }

  /**
   * Register new face
   */
  async registerFace(userId: string, name: string, imagePath: string): Promise<void> {
    try {
      console.log(`📸 Registering face for: ${name}`);

      const faceData: FaceData = {
        userId,
        name,
        lastSeen: new Date(),
        greetingCount: 0
      };

      this.knownFaces.set(userId, faceData);
      await this.saveKnownFaces();

      console.log(`✅ Face registered: ${name}`);
    } catch (error) {
      console.error('Face registration failed:', error);
      throw error;
    }
  }

  /**
   * Get personalized greeting
   */
  getGreeting(userId: string): string {
    const face = this.knownFaces.get(userId);
    if (!face) return 'Hello!';

    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    // Personalized based on greeting count
    if (face.greetingCount === 0) {
      return `${timeGreeting} ${face.name}! Great to see you!`;
    } else if (face.greetingCount < 5) {
      return `${timeGreeting} ${face.name}! How can I help you today?`;
    } else {
      return `Hey ${face.name}! What's up?`;
    }
  }

  /**
   * Get all known faces
   */
  getKnownFaces(): FaceData[] {
    return Array.from(this.knownFaces.values());
  }

  /**
   * Remove face
   */
  async removeFace(userId: string): Promise<void> {
    this.knownFaces.delete(userId);
    await this.saveKnownFaces();
    console.log(`❌ Face removed: ${userId}`);
  }

  /**
   * Load known faces from disk
   */
  private async loadKnownFaces(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'faces.json');
      const data = await fs.readFile(dataFile, 'utf-8');
      const faces = JSON.parse(data);
      
      this.knownFaces = new Map(
        faces.map((f: FaceData) => [f.userId, { ...f, lastSeen: new Date(f.lastSeen) }])
      );
      
      console.log(`📂 Loaded ${this.knownFaces.size} known faces`);
    } catch {
      // No saved faces yet
    }
  }

  /**
   * Save known faces to disk
   */
  private async saveKnownFaces(): Promise<void> {
    try {
      const dataFile = path.join(this.dataDir, 'faces.json');
      const faces = Array.from(this.knownFaces.values());
      await fs.writeFile(dataFile, JSON.stringify(faces, null, 2));
    } catch (error) {
      console.error('Failed to save faces:', error);
    }
  }

  /**
   * Enable/disable face detection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`👤 Face detection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if user is present
   */
  async isUserPresent(): Promise<boolean> {
    // TODO: Implement actual presence detection
    return this.knownFaces.size > 0;
  }
}

export const faceDetection = new FaceDetection();
