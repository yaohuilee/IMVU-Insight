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

/** List buyer options for select inputs Return select options for buyers. If `keyword` is provided and non-empty, search users by name or id.
Otherwise return the most-recent 20 buyers by payment time. POST /buyer/options */
export async function listBuyerOptions(
  body: INSIGHT_API.BuyerOptionsRequest,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.BuyerOption[]>(`/insight/api/buyer/options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
