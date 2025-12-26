// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List buyer aggregated stats (paginated) Return paginated buyer aggregated stats. POST /buyer/list */
export async function listBuyers(
  body: INSIGHT_API.PaginationParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedBuyerResponse>(
    `/insight/api/buyer/list`,
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
