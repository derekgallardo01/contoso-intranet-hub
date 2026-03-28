declare interface IOrgAnnouncementsWebPartStrings {
  PropertyPaneSiteUrlLabel: string;
  PropertyPaneListNameLabel: string;
  PropertyPaneMaxItemsLabel: string;
  AnnouncementsTitle: string;
  FilterByDepartment: string;
  AllDepartments: string;
  LoadingAnnouncements: string;
  UnableToLoad: string;
  RetryLabel: string;
  NoAnnouncementsFound: string;
  ExpiresPrefix: string;
}

declare module 'OrgAnnouncementsWebPartStrings' {
  const strings: IOrgAnnouncementsWebPartStrings;
  export = strings;
}
