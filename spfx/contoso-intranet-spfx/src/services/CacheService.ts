interface ICacheEntry<T> {
  value: T;
  expiry: number;
}

export class CacheService {
  private _storageType: 'session' | 'local';
  private _prefix: string;

  constructor(storageType: 'session' | 'local' = 'session', prefix: string = 'contoso_') {
    this._storageType = storageType;
    this._prefix = prefix;
  }

  private get _storage(): Storage {
    return this._storageType === 'local' ? localStorage : sessionStorage;
  }

  private _getKey(key: string): string {
    return `${this._prefix}${key}`;
  }

  public get<T>(key: string): T | null {
    try {
      const raw = this._storage.getItem(this._getKey(key));
      if (!raw) return null;

      const entry: ICacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiry) {
        this.remove(key);
        return null;
      }

      return entry.value;
    } catch {
      this.remove(key);
      return null;
    }
  }

  public set<T>(key: string, value: T, expiryMinutes: number = 30): void {
    try {
      const entry: ICacheEntry<T> = {
        value,
        expiry: Date.now() + expiryMinutes * 60 * 1000,
      };
      this._storage.setItem(this._getKey(key), JSON.stringify(entry));
    } catch {
      // Storage full or unavailable - silently fail
    }
  }

  public remove(key: string): void {
    try {
      this._storage.removeItem(this._getKey(key));
    } catch {
      // Silently fail
    }
  }

  public clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < this._storage.length; i++) {
        const key = this._storage.key(i);
        if (key && key.startsWith(this._prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => this._storage.removeItem(key));
    } catch {
      // Silently fail
    }
  }
}
