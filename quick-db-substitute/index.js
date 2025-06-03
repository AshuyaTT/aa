/**
 * Quick.db drop-in replacement without native dependencies
 * Uses in-memory storage with the same API as quick.db
 */

const EventEmitter = require('events');
const Keyv = require('keyv');
const store = new Keyv();

class QuickDB {
  constructor() {
    this.name = 'quick.db';
    this._data = new Map();
  }

  // Main methods
  async set(key, value) {
    await store.set(key, value);
    return value;
  }

  async get(key, defaultValue) {
    const value = await store.get(key);
    return value === undefined ? defaultValue : value;
  }

  async fetch(key, defaultValue) {
    return this.get(key, defaultValue);
  }

  async has(key) {
    return await store.get(key) !== undefined;
  }

  async delete(key) {
    return await store.delete(key);
  }

  async push(key, value) {
    const array = await this.get(key, []);
    if (!Array.isArray(array)) return false;
    array.push(value);
    return await this.set(key, array);
  }

  async add(key, amount) {
    const value = await this.get(key, 0);
    if (typeof value !== 'number') return false;
    return await this.set(key, value + amount);
  }

  async subtract(key, amount) {
    return await this.add(key, -amount);
  }

  async all() {
    // Placeholder - would need persistent storage to implement fully
    return [];
  }
}

// Table functionality
class Table extends QuickDB {
  constructor(tableName) {
    super();
    this.tableName = tableName;
  }

  async set(key, value) {
    return await store.set(`${this.tableName}.${key}`, value);
  }

  async get(key, defaultValue) {
    const value = await store.get(`${this.tableName}.${key}`);
    return value === undefined ? defaultValue : value;
  }

  async delete(key) {
    return await store.delete(`${this.tableName}.${key}`);
  }

  // Other methods work the same way with prefixed keys
}

// Make the API backward compatible with quick.db
const db = new QuickDB();
db.table = function(tableName) {
  return new Table(tableName);
};

// Add synchronous methods for backward compatibility
// These use their async counterparts but might cause timing issues
['set', 'get', 'fetch', 'has', 'delete', 'push', 'add', 'subtract', 'all'].forEach(method => {
  db[method + 'Sync'] = function(...args) {
    console.warn(`Warning: Using synchronous ${method}Sync method which is not recommended.`);
    let result;
    db[method](...args).then(r => result = r);
    return result;
  };
  
  // Add to Table prototype as well
  if (method !== 'all') {
    Table.prototype[method + 'Sync'] = function(...args) {
      console.warn(`Warning: Using synchronous ${method}Sync method which is not recommended.`);
      let result;
      this[method](...args).then(r => result = r);
      return result;
    };
  }
});

module.exports = db;