// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List Product objects (paginated) Return paginated products (only summary fields). Parameters are passed as an object via `Depends` for future extension. POST /product/list */
export async function listProducts(
  body: INSIGHT_API.PaginationParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedProductResponse>(
    `/insight/api/product/list`,
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

/** List product options for select inputs Return select options for products. If `keyword` is provided and non-empty, search products by name or id.
Otherwise return the most-recent products by sale time. POST /product/options */
export async function listProductOptions(
  body: INSIGHT_API.ProductOptionsRequest,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.ProductOption[]>(`/insight/api/product/options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
