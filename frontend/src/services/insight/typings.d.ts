declare namespace INSIGHT_API {
  type app_routes_imvuUser_ImvuUserSummary = {
    /** Id */
    id: number;
    /** Name */
    name?: string | null;
    /** First Seen */
    first_seen: string;
    /** Last Seen */
    last_seen: string;
  };

  type app_routes_incomeTransaction_ImvuUserSummary = {
    /** Id */
    id: number;
    /** Name */
    name?: string | null;
  };

  type app_routes_incomeTransaction_ProductSummary = {
    /** Product Id */
    product_id: number;
    /** Product Name */
    product_name: string;
    /** Visible */
    visible: boolean;
    /** Price */
    price: number;
  };

  type app_routes_product_ProductSummary = {
    /** Product Id */
    product_id: number;
    /** Product Name */
    product_name: string;
    /** Visible */
    visible: boolean;
    /** Price */
    price: string;
    /** First Sold At */
    first_sold_at?: string | null;
    /** Last Sold At */
    last_sold_at?: string | null;
  };

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
    /** Imported Count */
    imported_count?: number | null;
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

  type IncomeTransactionItem = {
    /** Transaction Id */
    transaction_id: number;
    /** Transaction Time */
    transaction_time: string;
    /** Product Id */
    product_id: number;
    product?: app_routes_incomeTransaction_ProductSummary | null;
    /** Developer User Id */
    developer_user_id: number;
    /** Buyer User Id */
    buyer_user_id: number;
    buyer_user?: app_routes_incomeTransaction_ImvuUserSummary | null;
    /** Recipient User Id */
    recipient_user_id: number;
    recipient_user?: app_routes_incomeTransaction_ImvuUserSummary | null;
    /** Reseller User Id */
    reseller_user_id?: number | null;
    /** Paid Credits */
    paid_credits: number;
    /** Paid Promo Credits */
    paid_promo_credits: number;
    /** Income Credits */
    income_credits: number;
    /** Income Promo Credits */
    income_promo_credits: number;
    /** Paid Total Credits */
    paid_total_credits: number;
    /** Income Total Credits */
    income_total_credits: number;
    /** Created At */
    created_at: string;
  };

  type listDataSyncRecordsParams = {
    /** Page number */
    page?: number;
    /** Page size */
    page_size?: number;
    /** Filter by data type */
    type?: DataType | null;
  };

  type listImvuUsersParams = {
    page?: number;
    page_size?: number;
  };

  type listIncomeTransactionsParams = {
    page?: number;
    page_size?: number;
  };

  type listProductsParams = {
    page?: number;
    page_size?: number;
  };

  type PaginatedImvuUserResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: app_routes_imvuUser_ImvuUserSummary[];
  };

  type PaginatedIncomeTransactionResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: IncomeTransactionItem[];
  };

  type PaginatedProductResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: app_routes_product_ProductSummary[];
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
