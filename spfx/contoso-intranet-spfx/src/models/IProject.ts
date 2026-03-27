export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface IProject {
  id: number;
  title: string;
  status: ProjectStatus;
  department: string;
  startDate: string;
  endDate: string;
  owner: string;
  description: string;
  progress: number;
}
