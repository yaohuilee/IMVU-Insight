// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List IncomeTransaction objects (paginated) POST /income_transaction/list */
export async function listIncomeTransactions(
  body: INSIGHT_API.IncomeTransactionPaginationParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedIncomeTransactionResponse>(
    `/insight/api/income_transaction/list`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}
