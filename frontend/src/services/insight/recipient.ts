// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List recipient aggregated stats (paginated) Return paginated recipient aggregated stats. GET /recipient/list */
export async function listRecipients(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.listRecipientsParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedRecipientResponse>(
    `/insight/api/recipient/list`,
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
