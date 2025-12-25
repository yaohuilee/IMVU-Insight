declare namespace INSIGHT_API {
  type BodyImportIncomeFile = {
    /** File */
    file: string;
  };

  type BodyImportProductFile = {
    /** File */
    file: string;
  };

  type DataSyncCreateResponse = {
    /** Id */
    id: number;
    /** Filename */
    filename: string;
  };

  type DataSyncRecordByHashResponse = {
    /** Exists */
    exists: boolean;
    record?: DataSyncRecordListItem | null;
  };

  type DataSyncRecordListItem = {
    /** Id */
    id: number;
    /** Uploaded At */
    uploaded_at: string;
    type: DataType;
    /** Filename */
    filename: string;
    /** Hash */
    hash: string;
    /** Record Count */
    record_count: number;
    /** File Size */
    file_size: number;
  };

  type DataSyncRecordListResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: DataSyncRecordListItem[];
  };

  type DataType = 'income' | 'product';

  type deleteDataSyncRecordParams = {
    /** ID of the DataSyncRecord to delete */
    id: number;
  };

  type getDataSyncRecordByHashParams = {
    /** File hash to check */
    hash: string;
  };

  type HTTPValidationError = {
    /** Detail */
    detail?: ValidationError[];
  };

  type listDataSyncRecordsParams = {
    /** Page number */
    page?: number;
    /** Page size */
    page_size?: number;
    /** Filter by data type */
    type?: DataType | null;
  };

  type ValidationError = {
    /** Location */
    loc: (string | number)[];
    /** Message */
    msg: string;
    /** Error Type */
    type: string;
  };
}
