import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { listImvuUsers } from '@/services/insight/imvuUser';
import type { ProColumns } from '@ant-design/pro-components';

const Users: React.FC = () => {
    const { formatMessage } = useIntl();

    const title = `${formatMessage({ id: 'imvuGraph.users.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

    const columns: ProColumns<any>[] = [
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.id' }),
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.name' }),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.firstSeen' }),
            dataIndex: 'first_seen',
            key: 'first_seen',
            valueType: 'dateTime',
            width: 180,
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.lastSeen' }),
            dataIndex: 'last_seen',
            key: 'last_seen',
            valueType: 'dateTime',
            width: 180,
        },
        {
            align: 'center',
            title: formatMessage({ id: 'imvuGraph.users.columns.action' }),
            dataIndex: 'action',
            valueType: 'option',
            width: 80,
            render: (_, record) => (
                <Link to={`/imvu-graph/users/${record.id}`}>
                    {formatMessage({ id: 'imvuGraph.users.columns.action.detail' })}
                </Link>
            ),
        }
    ];

    return (
        <>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <PageContainer title={formatMessage({ id: 'imvuGraph.users.pageTitle' })}>
                <ProTable<INSIGHT_API.ImvuUserSummary>
                    columns={columns}
                    rowKey="id"
                    search={false}
                    pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
                    request={async (params = {}) => {
                        const { current, pageSize, ...rest } = params as any;
                        try {
                            const res = await listImvuUsers({ page: current || 1, page_size: pageSize || 10, ...rest });
                            const anyRes = res as any;
                            const data = anyRes.items || anyRes.data || [];
                            const total = anyRes.total ?? anyRes.count ?? 0;
                            return { data, total, success: true };
                        } catch (error) {
                            return { data: [], total: 0, success: false };
                        }
                    }}
                />
            </PageContainer>
        </>
    );
};

export default Users;
