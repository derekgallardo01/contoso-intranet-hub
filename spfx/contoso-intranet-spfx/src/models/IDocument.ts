export interface IDocument {
  id: number;
  title: string;
  fileUrl: string;
  contentType: string;
  department: string;
  classification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  documentOwner: string;
  reviewDate: string;
  modifiedDate: string;
  modifiedBy: string;
  size: number;
  fileExtension: string;
}
