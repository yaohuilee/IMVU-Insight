import React from 'react';
import { ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import type { HistoryItem } from './types';
import { Space, Tag } from 'antd';

interface Props {
    history: HistoryItem[];
}

const ImportHistory: React.FC<Props> = ({ history }) => {
    const { formatMessage } = useIntl();

    const columns: ProColumns<HistoryItem>[] = [
        { title: formatMessage({ id: 'dataSync.table.importTime' }), dataIndex: 'importTime' },
        { title: formatMessage({ id: 'dataSync.table.type' }), dataIndex: 'type' },
        { title: formatMessage({ id: 'dataSync.table.fileName' }), dataIndex: 'fileName' },
        { title: formatMessage({ id: 'dataSync.table.records' }), dataIndex: 'records' },
        {
            title: formatMessage({ id: 'dataSync.table.status' }),
            dataIndex: 'status',
            render: (dom: React.ReactNode, entity: HistoryItem) => {
                const status = entity.status;
                const color = status === 'Success' ? 'green' : status === 'Partial Failure' ? 'orange' : 'red';
                return <Tag color={color as any}>{status}</Tag>;
            },
        },
        {
            title: formatMessage({ id: 'dataSync.table.action' }),
            dataIndex: 'action',
            render: (_: any, record: HistoryItem) => (
                <Space>
                    <a>{formatMessage({ id: 'dataSync.table.view' })}</a>
                    {record.status !== 'Success' && <a>{formatMessage({ id: 'dataSync.table.error' })}</a>}
                </Space>
            ),
        },
    ];

    return (
        <ProTable<HistoryItem>
            rowKey="key"
            columns={columns}
            dataSource={history}
            search={false}
            options={false}
            pagination={{ pageSize: 10 }}
        />
    );
};

export default ImportHistory;
