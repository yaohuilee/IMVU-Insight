// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List IncomeTransaction objects (paginated) GET /income_transaction/list */
export async function listIncomeTransactions(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.listIncomeTransactionsParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedIncomeTransactionResponse>(
    `/insight/api/income_transaction/list`,
    {
      method: 'GET',
      params: {
        // page has a default value: 1
        page: '1',
        // page_size has a default value: 50
        page_size: '50',
        ...params,
      },
      ...(options || {}),
    },
  );
}
