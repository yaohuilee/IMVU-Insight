declare namespace INSIGHT_API {
  type BodyImportIncomeFile = {
    /** File */
    file: string;
  };

  type BodyImportProductFile = {
    /** File */
    file: string;
  };

  type BuyerSummary = {
    /** Id */
    id: number;
    /** Name */
    name?: string | null;
    /** Buy Count */
    buy_count: number;
    /** Total Spent */
    total_spent: string;
    /** Total Credits */
    total_credits: string;
    /** Total Promo Credits */
    total_promo_credits: string;
    /** First Seen */
    first_seen: string;
    /** Last Seen */
    last_seen: string;
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

  type ImvuUserSummary = {
    /** Id */
    id: number;
    /** Name */
    name?: string | null;
    /** First Seen */
    first_seen?: string | null;
    /** Last Seen */
    last_seen?: string | null;
  };

  type IncomeTransactionItem = {
    /** Transaction Id */
    transaction_id: number;
    /** Transaction Time */
    transaction_time: string;
    /** Product Id */
    product_id: number;
    product?: ProductSummary | null;
    /** Developer User Id */
    developer_user_id: number;
    /** Buyer User Id */
    buyer_user_id: number;
    buyer_user?: ImvuUserSummary | null;
    /** Recipient User Id */
    recipient_user_id: number;
    recipient_user?: ImvuUserSummary | null;
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

  type listBuyersParams = {
    page?: number;
    page_size?: number;
  };

  type listDataSyncRecordsParams = {
    /** Page number */
    page?: number;
    /** Page size */
    page_size?: number;
    /** Filter by data type */
    type?: DataType | null;
  };

  type listProductsParams = {
    page?: number;
    page_size?: number;
  };

  type listRecipientsParams = {
    page?: number;
    page_size?: number;
  };

  type OrderItem = {
    /** Property */
    property: string;
    /** Direction */
    direction?: string | null;
  };

  type PaginatedBuyerResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: BuyerSummary[];
  };

  type PaginatedImvuUserResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: ImvuUserSummary[];
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
    items: ProductSummary[];
  };

  type PaginatedRecipientResponse = {
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Page Size */
    page_size: number;
    /** Items */
    items: RecipientSummary[];
  };

  type PaginationParams = {
    /** Page Page number (1-based) */
    page?: number;
    /** Page Size Items per page */
    page_size?: number;
    /** Orders */
    orders?: OrderItem[];
  };

  type ProductSummary = {
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

  type RecipientSummary = {
    /** Id */
    id: number;
    /** Name */
    name?: string | null;
    /** Receive Count */
    receive_count: number;
    /** Total Received */
    total_received: string;
    /** Total Credits */
    total_credits: string;
    /** Total Promo Credits */
    total_promo_credits: string;
    /** First Seen */
    first_seen: string;
    /** Last Seen */
    last_seen: string;
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
