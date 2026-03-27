export type PresenceStatus = 'Available' | 'Busy' | 'Away' | 'Offline';

export interface IPerson {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  officeLocation: string;
  phone: string;
  photoUrl: string;
  presence: PresenceStatus;
}
