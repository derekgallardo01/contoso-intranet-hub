import { GraphService } from '../GraphService';

// Create a fluent-chainable mock Graph client
function createMockGraphClient() {
  const chainable: Record<string, jest.Mock> = {};
  const methods = ['api', 'select', 'top', 'filter', 'header', 'search', 'responseType'];
  methods.forEach((method) => {
    chainable[method] = jest.fn().mockReturnValue(chainable);
  });
  chainable.get = jest.fn().mockResolvedValue({});
  return chainable;
}

describe('GraphService', () => {
  let graphService: GraphService;
  let mockClient: ReturnType<typeof createMockGraphClient>;

  beforeEach(() => {
    mockClient = createMockGraphClient();
    graphService = new GraphService(mockClient as never);
  });

  describe('getMe', () => {
    it('should return the current user mapped to IPerson', async () => {
      mockClient.get.mockResolvedValue({
        id: 'user-1',
        displayName: 'Jane Doe',
        mail: 'jane@contoso.com',
        jobTitle: 'Engineer',
        department: 'IT',
        officeLocation: 'Building A',
        mobilePhone: '+1-555-0100',
      });

      const person = await graphService.getMe();

      expect(mockClient.api).toHaveBeenCalledWith('/me');
      expect(mockClient.select).toHaveBeenCalledWith(
        'id,displayName,mail,jobTitle,department,officeLocation,mobilePhone'
      );
      expect(person).toEqual({
        id: 'user-1',
        displayName: 'Jane Doe',
        email: 'jane@contoso.com',
        jobTitle: 'Engineer',
        department: 'IT',
        officeLocation: 'Building A',
        phone: '+1-555-0100',
        photoUrl: '',
        presence: 'Offline',
      });
    });

    it('should handle missing fields with defaults', async () => {
      mockClient.get.mockResolvedValue({
        id: 'user-2',
        displayName: 'Minimal User',
      });

      const person = await graphService.getMe();

      expect(person.email).toBe('');
      expect(person.jobTitle).toBe('');
      expect(person.department).toBe('');
      expect(person.phone).toBe('');
    });
  });

  describe('getUsers', () => {
    it('should fetch users with no filters', async () => {
      mockClient.get.mockResolvedValue({
        value: [
          { id: '1', displayName: 'Alice', mail: 'alice@contoso.com', jobTitle: 'Dev', department: 'IT', officeLocation: '', mobilePhone: '' },
          { id: '2', displayName: 'Bob', mail: 'bob@contoso.com', jobTitle: 'PM', department: 'IT', officeLocation: '', mobilePhone: '' },
        ],
      });

      const users = await graphService.getUsers();

      expect(mockClient.api).toHaveBeenCalledWith('/users');
      expect(mockClient.top).toHaveBeenCalledWith(50);
      expect(users).toHaveLength(2);
      expect(users[0].displayName).toBe('Alice');
      expect(users[1].displayName).toBe('Bob');
    });

    it('should apply search header and search parameter when search is provided', async () => {
      mockClient.get.mockResolvedValue({ value: [] });

      await graphService.getUsers('alice');

      expect(mockClient.header).toHaveBeenCalledWith('ConsistencyLevel', 'eventual');
      expect(mockClient.search).toHaveBeenCalledWith('"displayName:alice" OR "mail:alice"');
    });

    it('should apply department filter', async () => {
      mockClient.get.mockResolvedValue({ value: [] });

      await graphService.getUsers(undefined, 'Engineering');

      expect(mockClient.filter).toHaveBeenCalledWith("department eq 'Engineering'");
    });

    it('should apply both search and department filter', async () => {
      mockClient.get.mockResolvedValue({ value: [] });

      await graphService.getUsers('jane', 'HR');

      expect(mockClient.search).toHaveBeenCalled();
      expect(mockClient.filter).toHaveBeenCalledWith("department eq 'HR'");
    });

    it('should handle empty response value', async () => {
      mockClient.get.mockResolvedValue({});

      const users = await graphService.getUsers();

      expect(users).toEqual([]);
    });
  });

  describe('getUserPresence', () => {
    it('should return Available for Available status', async () => {
      mockClient.get.mockResolvedValue({ availability: 'Available' });

      const presence = await graphService.getUserPresence('user-1');

      expect(mockClient.api).toHaveBeenCalledWith('/users/user-1/presence');
      expect(presence).toBe('Available');
    });

    it('should map AvailableIdle to Available', async () => {
      mockClient.get.mockResolvedValue({ availability: 'AvailableIdle' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Available');
    });

    it('should map Busy to Busy', async () => {
      mockClient.get.mockResolvedValue({ availability: 'Busy' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Busy');
    });

    it('should map DoNotDisturb to Busy', async () => {
      mockClient.get.mockResolvedValue({ availability: 'DoNotDisturb' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Busy');
    });

    it('should map Away to Away', async () => {
      mockClient.get.mockResolvedValue({ availability: 'Away' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Away');
    });

    it('should map BeRightBack to Away', async () => {
      mockClient.get.mockResolvedValue({ availability: 'BeRightBack' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Away');
    });

    it('should return Offline for Offline status', async () => {
      mockClient.get.mockResolvedValue({ availability: 'Offline' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Offline');
    });

    it('should return Offline for unknown availability', async () => {
      mockClient.get.mockResolvedValue({ availability: 'SomethingNew' });

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Offline');
    });

    it('should return Offline when availability is missing', async () => {
      mockClient.get.mockResolvedValue({});

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Offline');
    });

    it('should return Offline on API error', async () => {
      mockClient.get.mockRejectedValue(new Error('Forbidden'));

      const presence = await graphService.getUserPresence('user-1');
      expect(presence).toBe('Offline');
    });
  });

  describe('getUserPhoto', () => {
    it('should return a blob URL for the user photo', async () => {
      const mockBlob = new Blob(['photo'], { type: 'image/jpeg' });
      mockClient.get.mockResolvedValue(mockBlob);
      const mockUrl = 'blob:http://localhost/photo-123';
      (globalThis as Record<string, unknown>).URL = { createObjectURL: jest.fn().mockReturnValue(mockUrl) };

      const photoUrl = await graphService.getUserPhoto('user-1');

      expect(mockClient.api).toHaveBeenCalledWith('/users/user-1/photo/$value');
      expect(mockClient.responseType).toHaveBeenCalledWith('blob');
      expect(photoUrl).toBe(mockUrl);
    });

    it('should return empty string on error', async () => {
      mockClient.get.mockRejectedValue(new Error('Not found'));

      const photoUrl = await graphService.getUserPhoto('user-1');
      expect(photoUrl).toBe('');
    });
  });

  describe('getGroupMessages', () => {
    it('should return group conversations', async () => {
      mockClient.get.mockResolvedValue({
        value: [
          { id: 'msg-1', topic: 'Weekly Update', preview: 'Here is the update...', lastDeliveredDateTime: '2024-03-01T10:00:00Z' },
          { id: 'msg-2', topic: 'Sprint Review', preview: 'Sprint completed...', lastDeliveredDateTime: '2024-02-28T14:00:00Z' },
        ],
      });

      const messages = await graphService.getGroupMessages('group-1');

      expect(mockClient.api).toHaveBeenCalledWith('/groups/group-1/conversations');
      expect(mockClient.top).toHaveBeenCalledWith(10);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        id: 'msg-1',
        subject: 'Weekly Update',
        preview: 'Here is the update...',
        from: '',
        receivedDate: '2024-03-01T10:00:00Z',
      });
    });

    it('should handle missing fields', async () => {
      mockClient.get.mockResolvedValue({
        value: [{ id: 'msg-1' }],
      });

      const messages = await graphService.getGroupMessages('group-1');

      expect(messages[0].subject).toBe('');
      expect(messages[0].preview).toBe('');
      expect(messages[0].receivedDate).toBe('');
    });

    it('should return empty array on error', async () => {
      mockClient.get.mockRejectedValue(new Error('Group not found'));

      const messages = await graphService.getGroupMessages('group-1');
      expect(messages).toEqual([]);
    });

    it('should handle empty response value', async () => {
      mockClient.get.mockResolvedValue({});

      const messages = await graphService.getGroupMessages('group-1');
      expect(messages).toEqual([]);
    });
  });
});
