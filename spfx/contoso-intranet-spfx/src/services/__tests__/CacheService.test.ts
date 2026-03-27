import { CacheService } from '../CacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    sessionStorage.clear();
    cacheService = new CacheService('session', 'test_');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a string value', () => {
      cacheService.set('key1', 'hello');
      expect(cacheService.get<string>('key1')).toBe('hello');
    });

    it('should store and retrieve an object value', () => {
      const obj = { name: 'Test', count: 42 };
      cacheService.set('key2', obj);
      expect(cacheService.get<typeof obj>('key2')).toEqual(obj);
    });

    it('should store and retrieve an array value', () => {
      const arr = [1, 2, 3];
      cacheService.set('key3', arr);
      expect(cacheService.get<number[]>('key3')).toEqual(arr);
    });

    it('should return null for a non-existent key', () => {
      expect(cacheService.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing values', () => {
      cacheService.set('key1', 'first');
      cacheService.set('key1', 'second');
      expect(cacheService.get<string>('key1')).toBe('second');
    });
  });

  describe('TTL expiry', () => {
    it('should return value before expiry', () => {
      cacheService.set('ttlKey', 'value', 60);
      expect(cacheService.get<string>('ttlKey')).toBe('value');
    });

    it('should return null after expiry', () => {
      // Set with a very short TTL
      cacheService.set('ttlKey', 'value', 0);

      // Manually manipulate the stored entry to be expired
      const storageKey = 'test_ttlKey';
      const entry = JSON.parse(sessionStorage.getItem(storageKey)!);
      entry.expiry = Date.now() - 1000;
      sessionStorage.setItem(storageKey, JSON.stringify(entry));

      expect(cacheService.get<string>('ttlKey')).toBeNull();
    });

    it('should remove expired entry from storage', () => {
      cacheService.set('ttlKey', 'value', 1);

      // Expire the entry
      const storageKey = 'test_ttlKey';
      const entry = JSON.parse(sessionStorage.getItem(storageKey)!);
      entry.expiry = Date.now() - 1000;
      sessionStorage.setItem(storageKey, JSON.stringify(entry));

      cacheService.get('ttlKey');
      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a cached value', () => {
      cacheService.set('key1', 'value');
      cacheService.remove('key1');
      expect(cacheService.get('key1')).toBeNull();
    });

    it('should not throw when removing a non-existent key', () => {
      expect(() => cacheService.remove('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all cached values with the prefix', () => {
      cacheService.set('a', 1);
      cacheService.set('b', 2);
      cacheService.set('c', 3);

      cacheService.clear();

      expect(cacheService.get('a')).toBeNull();
      expect(cacheService.get('b')).toBeNull();
      expect(cacheService.get('c')).toBeNull();
    });

    it('should not remove values from other prefixes', () => {
      cacheService.set('myKey', 'myValue');
      sessionStorage.setItem('other_key', 'otherValue');

      cacheService.clear();

      expect(sessionStorage.getItem('other_key')).toBe('otherValue');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      cacheService.set('nullKey', null);
      expect(cacheService.get('nullKey')).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      sessionStorage.setItem('test_badKey', 'not-json');
      expect(cacheService.get('badKey')).toBeNull();
    });
  });
});
