export interface INavigationNode {
  id: number;
  title: string;
  url: string;
  parent: string | null;
  order: number;
  openInNewTab: boolean;
  children: INavigationNode[];
}
