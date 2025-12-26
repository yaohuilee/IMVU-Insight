// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List Product objects (paginated) Return paginated products (only summary fields). Parameters are passed as an object via `Depends` for future extension. GET /product/list */
export async function listProducts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.listProductsParams,
  body: INSIGHT_API.OrderItem[],
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedProductResponse>(
    `/insight/api/product/list`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        // page has a default value: 1
        page: '1',
        // page_size has a default value: 20
        page_size: '20',
        ...params,
      },
      data: body,
      ...(options || {}),
    },
  );
}
