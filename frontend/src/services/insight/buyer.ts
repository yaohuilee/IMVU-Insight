// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List buyer aggregated stats (paginated) Return paginated buyer aggregated stats. GET /buyer/list */
export async function listBuyers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.listBuyersParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedBuyerResponse>(
    `/insight/api/buyer/list`,
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
