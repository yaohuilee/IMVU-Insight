// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Check whether a DataSyncRecord with given hash exists Return existence flag and the most recent matching record when present.

Always returns HTTP 200. When a record exists, `exists` is true and
`record` contains the first matching item's metadata. When no record is
found, returns `{ "exists": false }`. GET /data-sync/by-hash */
export async function getDataSyncRecordByHash(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.getDataSyncRecordByHashParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.DataSyncRecordByHashResponse>(
    `/insight/api/data-sync/by-hash`,
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** Import income data file Upload an income file and create a data sync record. POST /data-sync/income/import */
export async function importIncomeFile(
  body: INSIGHT_API.BodyImportIncomeFile,
  file?: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: 'application/json' }),
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<INSIGHT_API.DataSyncCreateResponse>(
    `/insight/api/data-sync/income/import`,
    {
      method: 'POST',
      data: formData,
      requestType: 'form',
      ...(options || {}),
    },
  );
}

/** List DataSyncRecord objects (paginated, no content) Get paginated DataSyncRecord objects, excluding content. GET /data-sync/list */
export async function listDataSyncRecords(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.listDataSyncRecordsParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.DataSyncRecordListResponse>(
    `/insight/api/data-sync/list`,
    {
      method: 'GET',
      params: {
        // page has a default value: 1
        page: '1',
        // page_size has a default value: 20
        page_size: '20',
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** Delete a DataSyncRecord by ID Delete a DataSyncRecord by its ID and return deletion result.

Returns HTTP 200 with `{ "deleted": true }` on success, or
HTTP 404 when the record does not exist. DELETE /data-sync/object */
export async function deleteDataSyncRecord(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: INSIGHT_API.deleteDataSyncRecordParams,
  options?: { [key: string]: any },
) {
  return request<any>(`/insight/api/data-sync/object`, {
    method: 'DELETE',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Import product data file Upload a product file and create a data sync record. POST /data-sync/product/import */
export async function importProductFile(
  body: INSIGHT_API.BodyImportProductFile,
  file?: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: 'application/json' }),
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<INSIGHT_API.DataSyncCreateResponse>(
    `/insight/api/data-sync/product/import`,
    {
      method: 'POST',
      data: formData,
      requestType: 'form',
      ...(options || {}),
    },
  );
}
