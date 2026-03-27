import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IPerson, PresenceStatus } from '../models/IPerson';

export class GraphService {
  private _graphClient: MSGraphClientV3;

  constructor(graphClient: MSGraphClientV3) {
    this._graphClient = graphClient;
  }

  public async getMe(): Promise<IPerson> {
    const response = await this._graphClient
      .api('/me')
      .select('id,displayName,mail,jobTitle,department,officeLocation,mobilePhone')
      .get();

    return this._mapUserToPerson(response);
  }

  public async getUsers(search?: string, department?: string): Promise<IPerson[]> {
    let query = this._graphClient.api('/users').top(50);

    const filters: string[] = [];
    if (search) {
      query = query.header('ConsistencyLevel', 'eventual')
        .search(`"displayName:${search}" OR "mail:${search}"`);
    }
    if (department) {
      filters.push(`department eq '${department}'`);
    }
    if (filters.length > 0) {
      query = query.filter(filters.join(' and '));
    }

    query = query.select('id,displayName,mail,jobTitle,department,officeLocation,mobilePhone');

    const response = await query.get();
    const users: IPerson[] = (response.value || []).map(
      (user: Record<string, string>) => this._mapUserToPerson(user)
    );

    return users;
  }

  public async getUserPresence(userId: string): Promise<PresenceStatus> {
    try {
      const response = await this._graphClient
        .api(`/users/${userId}/presence`)
        .get();

      const availability: string = response.availability || 'Offline';
      const statusMap: Record<string, PresenceStatus> = {
        Available: 'Available',
        AvailableIdle: 'Available',
        Busy: 'Busy',
        BusyIdle: 'Busy',
        DoNotDisturb: 'Busy',
        Away: 'Away',
        BeRightBack: 'Away',
        Offline: 'Offline',
        PresenceUnknown: 'Offline',
      };

      return statusMap[availability] || 'Offline';
    } catch {
      return 'Offline';
    }
  }

  public async getUserPhoto(userId: string): Promise<string> {
    try {
      const blob = await this._graphClient
        .api(`/users/${userId}/photo/$value`)
        .responseType('blob' as never)
        .get();

      return URL.createObjectURL(blob as Blob);
    } catch {
      return '';
    }
  }

  public async getGroupMessages(
    groupId: string
  ): Promise<Array<{ id: string; subject: string; preview: string; from: string; receivedDate: string }>> {
    try {
      const response = await this._graphClient
        .api(`/groups/${groupId}/conversations`)
        .top(10)
        .select('id,topic,preview,lastDeliveredDateTime')
        .get();

      return (response.value || []).map(
        (msg: Record<string, string>) => ({
          id: msg.id,
          subject: msg.topic || '',
          preview: msg.preview || '',
          from: '',
          receivedDate: msg.lastDeliveredDateTime || '',
        })
      );
    } catch {
      return [];
    }
  }

  private _mapUserToPerson(user: Record<string, string>): IPerson {
    return {
      id: user.id || '',
      displayName: user.displayName || '',
      email: user.mail || user.userPrincipalName || '',
      jobTitle: user.jobTitle || '',
      department: user.department || '',
      officeLocation: user.officeLocation || '',
      phone: user.mobilePhone || user.businessPhones?.[0] || '',
      photoUrl: '',
      presence: 'Offline',
    };
  }
}
