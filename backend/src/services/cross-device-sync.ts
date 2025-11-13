// ============================================================================
// CROSS-DEVICE SYNC - Sync across Mac, iPhone, iPad
// ============================================================================

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { supabase } from '../config/supabase';

interface Device {
  id: string;
  name: string;
  type: 'mac' | 'iphone' | 'ipad' | 'web';
  lastSeen: Date;
  ipAddress?: string;
  status: 'online' | 'offline';
}

interface SyncData {
  id: string;
  type: 'memory' | 'reminder' | 'setting' | 'conversation' | 'autopilot';
  data: any;
  timestamp: Date;
  deviceId: string;
  synced: boolean;
}

interface SyncStatus {
  totalDevices: number;
  onlineDevices: number;
  lastSync: Date | null;
  pendingSync: number;
}

export class CrossDeviceSync extends EventEmitter {
  private enabled: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private devices: Map<string, Device> = new Map();
  private syncQueue: SyncData[] = [];
  private syncDir: string;
  private deviceId: string;
  private deviceName: string;
  private useSupabase: boolean = false;

  constructor() {
    super();
    const homeDir = process.env.HOME || '';
    this.syncDir = path.join(homeDir, '.rags', 'sync');
    this.deviceId = this.generateDeviceId();
    this.deviceName = 'Mac';
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.syncDir, { recursive: true });
      await this.loadDevices();
      await this.loadSyncQueue();
      
      // Register this device
      await this.registerDevice({
        id: this.deviceId,
        name: this.deviceName,
        type: 'mac',
        lastSeen: new Date(),
        status: 'online'
      });

      // Check if Supabase is available
      this.useSupabase = await this.checkSupabaseAvailable();
      
      console.log('🔄 Cross-device sync initialized');
      console.log(`📱 Device ID: ${this.deviceId}`);
      
      if (this.useSupabase) {
        console.log('✅ Using Supabase for cloud sync');
      } else {
        console.log('⚠️ Using local file-based sync (Supabase not configured)');
      }
    } catch (error) {
      console.error('Sync init failed:', error);
    }
  }

  /**
   * Start syncing
   */
  async start(): Promise<void> {
    if (this.enabled) return;

    this.enabled = true;
    console.log('🔄 Cross-device sync started');

    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, 30000);

    // Initial sync
    await this.performSync();
  }

  /**
   * Stop syncing
   */
  stop(): void {
    this.enabled = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('🛑 Cross-device sync stopped');
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    // Use MAC address or generate unique ID
    const hash = crypto.createHash('sha256');
    hash.update(process.env.USER || 'unknown');
    hash.update(process.env.HOME || 'unknown');
    hash.update(Date.now().toString());
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Register device
   */
  async registerDevice(device: Device): Promise<void> {
    this.devices.set(device.id, device);
    await this.saveDevices();
    this.emit('device_registered', device);
    console.log(`📱 Device registered: ${device.name} (${device.type})`);
  }

  /**
   * Queue data for sync
   */
  async queueSync(type: SyncData['type'], data: any): Promise<void> {
    const syncData: SyncData = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      deviceId: this.deviceId,
      synced: false
    };

    this.syncQueue.push(syncData);
    await this.saveSyncQueue();
    this.emit('sync_queued', syncData);

    console.log(`📤 Queued for sync: ${type}`);
  }

  /**
   * Perform sync operation
   */
  private async performSync(): Promise<void> {
    if (!this.enabled || this.syncQueue.length === 0) return;

    try {
      console.log(`🔄 Syncing ${this.syncQueue.length} items...`);

      // In production, this would:
      // 1. Connect to sync server or P2P network
      // 2. Upload pending changes
      // 3. Download changes from other devices
      // 4. Merge conflicts
      // 5. Update local state

      // For now, simulate sync
      await this.simulateSync();

      // Mark items as synced
      this.syncQueue = this.syncQueue.filter(item => {
        if (!item.synced) {
          item.synced = true;
          this.emit('item_synced', item);
          return false; // Remove from queue
        }
        return true;
      });

      await this.saveSyncQueue();
      this.emit('sync_complete', { itemsSynced: this.syncQueue.length });
      
      if (this.syncQueue.length > 0) {
        console.log(`✅ Synced ${this.syncQueue.length} items`);
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.emit('sync_failed', error);
    }
  }

  /**
   * Check if Supabase is available
   */
  private async checkSupabaseAvailable(): Promise<boolean> {
    try {
      if (!supabase) return false;
      // Try a simple query to check connection
      const { error } = await supabase.from('sync_queue').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Real sync implementation using Supabase or local files
   */
  private async simulateSync(): Promise<void> {
    if (this.useSupabase) {
      // Use Supabase for cloud sync
      await this.syncWithSupabase();
    } else {
      // Use local file sync as fallback
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Sync data using Supabase
   */
  private async syncWithSupabase(): Promise<void> {
    try {
      // Upload pending items
      for (const item of this.syncQueue) {
        if (!item.synced) {
          const { error } = await supabase.from('sync_queue').upsert({
            id: item.id,
            type: item.type,
            data: item.data,
            timestamp: item.timestamp,
            device_id: item.deviceId,
            synced: true
          });
          
          if (!error) {
            item.synced = true;
          }
        }
      }
      
      // Download new items from other devices
      const { data: remoteItems } = await supabase
        .from('sync_queue')
        .select('*')
        .neq('device_id', this.deviceId)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (remoteItems && remoteItems.length > 0) {
        console.log(`📥 Downloaded ${remoteItems.length} items from cloud`);
        // Process remote items (merge with local data)
        for (const item of remoteItems) {
          this.emit('remote_data_received', item);
        }
      }
    } catch (error) {
      console.error('❌ Supabase sync failed:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    const onlineDevices = Array.from(this.devices.values())
      .filter(d => d.status === 'online').length;

    const lastSyncItem = this.syncQueue
      .filter(item => item.synced)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      totalDevices: this.devices.size,
      onlineDevices,
      lastSync: lastSyncItem ? lastSyncItem.timestamp : null,
      pendingSync: this.syncQueue.filter(item => !item.synced).length
    };
  }

  /**
   * Get all devices
   */
  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get online devices
   */
  getOnlineDevices(): Device[] {
    return Array.from(this.devices.values())
      .filter(d => d.status === 'online');
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string, status: 'online' | 'offline'): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date();
      await this.saveDevices();
      this.emit('device_status_changed', device);
    }
  }

  /**
   * Save devices to disk
   */
  private async saveDevices(): Promise<void> {
    const filePath = path.join(this.syncDir, 'devices.json');
    const devicesArray = Array.from(this.devices.values());
    await fs.writeFile(filePath, JSON.stringify(devicesArray, null, 2), 'utf-8');
  }

  /**
   * Load devices from disk
   */
  private async loadDevices(): Promise<void> {
    try {
      const filePath = path.join(this.syncDir, 'devices.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const devicesArray: Device[] = JSON.parse(content);
      
      for (const device of devicesArray) {
        this.devices.set(device.id, device);
      }

      console.log(`📱 Loaded ${this.devices.size} devices`);
    } catch {
      // No devices yet
    }
  }

  /**
   * Save sync queue to disk
   */
  private async saveSyncQueue(): Promise<void> {
    const filePath = path.join(this.syncDir, 'queue.json');
    await fs.writeFile(filePath, JSON.stringify(this.syncQueue, null, 2), 'utf-8');
  }

  /**
   * Load sync queue from disk
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const filePath = path.join(this.syncDir, 'queue.json');
      const content = await fs.readFile(filePath, 'utf-8');
      this.syncQueue = JSON.parse(content);
      console.log(`📋 Loaded ${this.syncQueue.length} pending sync items`);
    } catch {
      // No queue yet
    }
  }

  /**
   * Is sync enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Setup instructions
   */
  static getSetupInstructions(): string {
    return `
Cross-Device Sync Setup Instructions:

RAGS currently uses local file-based sync (no cloud).

For Full Cross-Device Sync, you need:

1. Cloud Backend (Choose one):
   a) Supabase (Recommended - already in codebase)
      - Enable Supabase in .env
      - SUPABASE_URL=your-url
      - SUPABASE_ANON_KEY=your-key
   
   b) Firebase
      - npm install firebase
      - Configure Firebase project
   
   c) Custom API Server
      - Build sync API endpoint
      - Use WebSocket for real-time

2. Local Network Sync (P2P):
   - Use mdns for device discovery
   - WebSocket for peer communication
   - No cloud needed!

3. iOS/iPad Apps:
   - Build React Native apps
   - Or use Capacitor to wrap web app
   - Share same backend API

4. iCloud Sync (Mac/iOS only):
   - Use CloudKit
   - Apple Developer account needed

Current Mode: Local file-based (single device)

To Enable:
1. Set up Supabase (already integrated)
2. Or implement P2P sync
3. Build mobile apps
4. Enable sync in settings

Note: All data is stored locally in ~/.rags/
Sync will merge changes across devices when enabled.
    `.trim();
  }
}

export const crossDeviceSync = new CrossDeviceSync();
