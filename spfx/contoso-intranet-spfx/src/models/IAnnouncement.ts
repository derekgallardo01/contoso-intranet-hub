export type AnnouncementPriority = 'High' | 'Medium' | 'Low';

export interface IAnnouncement {
  id: number;
  title: string;
  body: string;
  department: string;
  priority: AnnouncementPriority;
  expiryDate: string;
  createdDate: string;
  author: string;
}
