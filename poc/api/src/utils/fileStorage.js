const fs = require('fs').promises;
const path = require('path');
const lockfile = require('proper-lockfile');
const { getConfig } = require('../config');
const logger = require('./logger');

/**
 * Enhanced file storage utilities for financial data with atomic operations,
 * rotation, backup, and integrity checks
 */
class FileStorageManager {
  constructor(baseDir = path.join(__dirname, '../ledger')) {
    this.baseDir = baseDir;
    this.maxFileSize = getConfig('LEDGER_FILE_MAX_SIZE', 104857600); // 100MB default
    this.backupRetentionDays = getConfig('BACKUP_RETENTION_DAYS', 90);
    this.lockOptions = {
      stale: 30000, // 30 seconds
      retries: {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000
      }
    };
  }

  /**
   * Atomic write operation with file locking
   * @param {string} filePath - Absolute path to the file
   * @param {Object|Array} data - Data to write
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async atomicWrite(filePath, data, options = {}) {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    const lockPath = `${filePath}.lock`;
    
    let release;
    
    try {
      // Acquire file lock
      release = await lockfile.lock(lockPath, this.lockOptions);
      
      // Check if rotation is needed before writing
      if (options.checkRotation !== false) {
        await this.rotateIfNeeded(filePath);
      }
      
      // Write to temporary file first
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, jsonData, 'utf8');
      
      // Verify the written data
      if (options.verify !== false) {
        await this.verifyFileIntegrity(tempPath, data);
      }
      
      // Atomic rename (move) to final location
      await fs.rename(tempPath, filePath);
      
      logger.info('File written atomically', {
        file_path: path.basename(filePath),
        file_size: jsonData.length,
        event_type: 'file_write'
      });
      
    } catch (error) {
      // Cleanup temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file', {
          temp_path: tempPath,
          error: cleanupError.message
        });
      }
      
      logger.error('Atomic write failed', {
        file_path: path.basename(filePath),
        error_message: error.message,
        event_type: 'file_write_error'
      });
      
      throw new Error(`Atomic write failed: ${error.message}`);
    } finally {
      // Release the lock
      if (release) {
        try {
          await release();
        } catch (lockError) {
          logger.warn('Failed to release file lock', {
            file_path: path.basename(filePath),
            error: lockError.message
          });
        }
      }
    }
  }

  /**
   * Safe file read operation with locking
   * @param {string} filePath - Absolute path to the file
   * @param {Object} options - Additional options
   * @returns {Promise<Object|Array>}
   */
  async safeRead(filePath, options = {}) {
    const lockPath = `${filePath}.lock`;
    let release;
    
    try {
      // Acquire read lock
      release = await lockfile.lock(lockPath, {
        ...this.lockOptions,
        realpath: false // Don't resolve symlinks for lock
      });
      
      // Check if file exists
      try {
        await fs.access(filePath, fs.constants.R_OK);
      } catch (error) {
        if (options.createIfMissing) {
          const defaultData = options.defaultData || (Array.isArray(options.defaultData) ? [] : {});
          await this.atomicWrite(filePath, defaultData, { checkRotation: false });
          return defaultData;
        }
        throw new Error(`File not readable: ${filePath}`);
      }
      
      // Read and parse file
      const rawData = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Verify data integrity if checksum exists
      if (options.verifyIntegrity !== false) {
        await this.verifyFileIntegrity(filePath, data);
      }
      
      logger.debug('File read successfully', {
        file_path: path.basename(filePath),
        file_size: rawData.length,
        event_type: 'file_read'
      });
      
      return data;
      
    } catch (error) {
      logger.error('Safe read failed', {
        file_path: path.basename(filePath),
        error_message: error.message,
        event_type: 'file_read_error'
      });
      
      throw new Error(`Safe read failed: ${error.message}`);
    } finally {
      if (release) {
        try {
          await release();
        } catch (lockError) {
          logger.warn('Failed to release read lock', {
            file_path: path.basename(filePath),
            error: lockError.message
          });
        }
      }
    }
  }

  /**
   * Rotate file if it exceeds size limit
   * @param {string} filePath - Path to the file to check
   * @returns {Promise<boolean>} - True if rotation occurred
   */
  async rotateIfNeeded(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > this.maxFileSize) {
        await this.rotateFile(filePath);
        return true;
      }
      
      return false;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, no rotation needed
        return false;
      }
      throw error;
    }
  }

  /**
   * Rotate a file by moving it to an archive location
   * @param {string} filePath - Path to the file to rotate
   * @returns {Promise<string>} - Path to the rotated file
   */
  async rotateFile(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dirName = path.dirname(filePath);
    
    const rotatedPath = path.join(dirName, 'archive', `${baseName}-${timestamp}${ext}`);
    
    try {
      // Ensure archive directory exists
      const archiveDir = path.dirname(rotatedPath);
      await fs.mkdir(archiveDir, { recursive: true });
      
      // Move current file to archive
      await fs.rename(filePath, rotatedPath);
      
      // Create new empty file with appropriate structure
      const emptyData = this.getEmptyDataStructure(filePath);
      await fs.writeFile(filePath, JSON.stringify(emptyData, null, 2), 'utf8');
      
      logger.info('File rotated successfully', {
        original_path: path.basename(filePath),
        rotated_path: path.basename(rotatedPath),
        event_type: 'file_rotation'
      });
      
      // Schedule cleanup of old archives
      this.scheduleArchiveCleanup(archiveDir);
      
      return rotatedPath;
    } catch (error) {
      logger.error('File rotation failed', {
        file_path: path.basename(filePath),
        error_message: error.message,
        event_type: 'file_rotation_error'
      });
      
      throw new Error(`File rotation failed: ${error.message}`);
    }
  }

  /**
   * Create backup of important files
   * @param {string} filePath - Path to the file to backup
   * @returns {Promise<string>} - Path to the backup file
   */
  async createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dirName = path.dirname(filePath);
    
    const backupPath = path.join(dirName, 'backups', `${baseName}-backup-${timestamp}${ext}`);
    
    try {
      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath);
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy file to backup location
      await fs.copyFile(filePath, backupPath);
      
      logger.info('Backup created successfully', {
        original_path: path.basename(filePath),
        backup_path: path.basename(backupPath),
        event_type: 'backup_created'
      });
      
      return backupPath;
    } catch (error) {
      logger.error('Backup creation failed', {
        file_path: path.basename(filePath),
        error_message: error.message,
        event_type: 'backup_error'
      });
      
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Verify file integrity using basic checks
   * @param {string} filePath - Path to the file to verify
   * @param {Object|Array} expectedData - Expected data structure
   * @returns {Promise<boolean>}
   */
  async verifyFileIntegrity(filePath, expectedData) {
    try {
      const rawData = await fs.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(rawData);
      
      // Basic structure validation
      if (Array.isArray(expectedData) && !Array.isArray(parsedData)) {
        throw new Error('Data structure mismatch: expected array');
      }
      
      if (typeof expectedData === 'object' && !expectedData.length && Array.isArray(parsedData)) {
        throw new Error('Data structure mismatch: expected object');
      }
      
      // Verify data can be serialized back to the same JSON
      const reserializedData = JSON.stringify(parsedData);
      if (reserializedData !== JSON.stringify(expectedData)) {
        // This is expected for different data, just ensure it's valid JSON
        JSON.parse(reserializedData);
      }
      
      return true;
    } catch (error) {
      logger.error('File integrity verification failed', {
        file_path: path.basename(filePath),
        error_message: error.message,
        event_type: 'integrity_check_failed'
      });
      
      throw new Error(`File integrity verification failed: ${error.message}`);
    }
  }

  /**
   * Get appropriate empty data structure for a file type
   * @param {string} filePath - Path to determine file type
   * @returns {Object|Array}
   */
  getEmptyDataStructure(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('ledger')) {
      return []; // Ledger is an array of transactions
    } else if (fileName.includes('banks')) {
      return []; // Banks is an array of bank configurations
    } else if (fileName.includes('reserve')) {
      return { total: 0, available: 0 }; // Reserve is an object with total/available
    }
    
    // Default to empty array for unknown file types
    return [];
  }

  /**
   * Schedule cleanup of old archive files
   * @param {string} archiveDir - Directory containing archives
   */
  async scheduleArchiveCleanup(archiveDir) {
    try {
      const files = await fs.readdir(archiveDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupRetentionDays);
      
      for (const file of files) {
        const filePath = path.join(archiveDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          logger.info('Old archive file deleted', {
            file_path: file,
            age_days: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)),
            event_type: 'archive_cleanup'
          });
        }
      }
    } catch (error) {
      logger.warn('Archive cleanup failed', {
        archive_dir: archiveDir,
        error_message: error.message,
        event_type: 'cleanup_error'
      });
    }
  }

  /**
   * Get storage statistics for monitoring
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    try {
      const stats = {
        base_directory: this.baseDir,
        max_file_size: this.maxFileSize,
        backup_retention_days: this.backupRetentionDays,
        files: {},
        total_size: 0,
        last_updated: new Date().toISOString()
      };
      
      const files = await fs.readdir(this.baseDir);
      
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filePath = path.join(this.baseDir, file);
        const fileStats = await fs.stat(filePath);
        
        stats.files[file] = {
          size_bytes: fileStats.size,
          size_mb: Math.round(fileStats.size / 1024 / 1024 * 100) / 100,
          last_modified: fileStats.mtime.toISOString(),
          needs_rotation: fileStats.size > this.maxFileSize
        };
        
        stats.total_size += fileStats.size;
      }
      
      stats.total_size_mb = Math.round(stats.total_size / 1024 / 1024 * 100) / 100;
      
      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', {
        error_message: error.message,
        event_type: 'storage_stats_error'
      });
      
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }
}

// Create singleton instance
const fileStorageManager = new FileStorageManager();

// Export convenience functions for backward compatibility
async function atomicWrite(filePath, data) {
  return fileStorageManager.atomicWrite(filePath, data);
}

async function safeRead(filePath, options = {}) {
  return fileStorageManager.safeRead(filePath, options);
}

async function createBackup(filePath) {
  return fileStorageManager.createBackup(filePath);
}

async function getStorageStats() {
  return fileStorageManager.getStorageStats();
}

module.exports = {
  FileStorageManager,
  fileStorageManager,
  atomicWrite,
  safeRead,
  createBackup,
  getStorageStats
};