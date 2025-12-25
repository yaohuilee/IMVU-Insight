// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List ImvuUser objects (paginated) Return paginated imvu users (summary fields). GET /imvu_user/list */
export async function listImvuUsers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.listImvuUsersParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedImvuUserResponse>(
    `/insight/api/imvu_user/list`,
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
