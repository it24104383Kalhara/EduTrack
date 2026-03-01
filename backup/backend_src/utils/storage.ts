// Simple storage utility for Node.js environment
// Mimics localStorage functionality for server-side use

class Storage {
  private data: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }
}

// Create a global storage instance
const storage = new Storage();

// Make it available globally
(global as any).localStorage = storage;

export default storage;
