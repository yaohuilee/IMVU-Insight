import React from 'react';
import { useIntl } from '@umijs/max';
import ProTable, { ActionType } from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import { Popconfirm, message } from 'antd';
import { listDataSyncRecords, deleteDataSyncRecord } from '@/services/insight/dataSync';

interface Props {
    actionRef?: React.MutableRefObject<ActionType | undefined> | undefined;
}

const ImportHistory: React.FC<Props> = ({ actionRef }) => {
    const { formatMessage } = useIntl();

    // Helper to format file size with thousands separator and appropriate unit
    const formatFileSize = (size: number): string => {
        if (isNaN(size) || size === null) return '';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let idx = 0;
        let s = size;
        while (s >= 1024 && idx < units.length - 1) {
            s = s / 1024;
            idx++;
        }
        // Use thousands separator for integer part, show up to 2 decimals for non-bytes
        return idx === 0
            ? s.toLocaleString() + ' ' + units[idx]
            : s.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + units[idx];
    };

    const columns: ProColumns<INSIGHT_API.DataSyncRecordListItem>[] = [
        {
            title: formatMessage({ id: 'dataSync.table.uploadedAt' }),
            width: 160,
            dataIndex: 'uploaded_at',
            render: (_, row) => {
                if (!row.uploaded_at) return '';
                // Assume row.uploaded_at is ISO string in UTC
                const date = new Date(row.uploaded_at + (row.uploaded_at.endsWith('Z') ? '' : 'Z'));
                return date.toLocaleString();
            },
        },
        {
            title: formatMessage({ id: 'dataSync.table.type' }),
            align: 'center',
            width: 80,
            dataIndex: 'type',
            valueEnum: {
                income: { text: 'Income' },
                product: { text: 'Product' },
            },
        },
        {
            title: formatMessage({ id: 'dataSync.table.fileName' }),
            dataIndex: 'filename',
            ellipsis: true,
        },
        {
            title: formatMessage({ id: 'dataSync.table.hash' }),
            dataIndex: 'hash',
            ellipsis: true,
            copyable: true,
        },
        {
            title: formatMessage({ id: 'dataSync.table.records' }),
            align: 'right',
            width: 80,
            dataIndex: 'record_count',
            render: (_, row) => row.record_count !== null ? row.record_count.toLocaleString() : '',
        },
        {
            title: formatMessage({ id: 'dataSync.table.fileSize' }),
            align: 'right',
            width: 80,
            dataIndex: 'file_size',
            render: (_, row) => formatFileSize(row.file_size),
        },
        {
            title: formatMessage({ id: 'dataSync.table.action' }),
            align: 'center',
            width: 80,
            fixed: 'right',
            valueType: 'option',
            render: (_, row) => (
                <Popconfirm
                    title={formatMessage({ id: 'dataSync.table.deleteConfirm' })}
                    onConfirm={async () => {
                        try {
                            const res = await deleteDataSyncRecord({ id: row.id });
                            if (res && res.deleted) {
                                message.success(formatMessage({ id: 'dataSync.table.deleteSuccess' }));
                                actionRef?.current?.reload();
                            } else {
                                message.info(res?.message || formatMessage({ id: 'dataSync.table.deleteNotExist' }));
                                actionRef?.current?.reload();
                            }
                        } catch (err) {
                            message.error(formatMessage({ id: 'dataSync.table.deleteFailed' }));
                        }
                    }}
                    okText={formatMessage({ id: 'dataSync.table.ok' })}
                    cancelText={formatMessage({ id: 'dataSync.table.cancel' })}
                >
                    <a>{formatMessage({ id: 'dataSync.table.delete' })}</a>
                </Popconfirm>
            ),
        },
    ];

    return (
        <ProTable<INSIGHT_API.DataSyncRecordListItem>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={false}
            options={false}
            pagination={{ pageSize: 10 }}
            request={async (params) => {
                const { current = 1, pageSize = 10 } = params;
                const res = await listDataSyncRecords({ page: current, page_size: pageSize });
                return {
                    data: (res.items || []).map((item) => ({
                        ...item,
                        key: String(item.id),
                    })),
                    total: res.total,
                    success: true,
                };
            }}
        />
    );
};

export default ImportHistory;
