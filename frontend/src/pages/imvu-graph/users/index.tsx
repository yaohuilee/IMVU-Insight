import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { SortOrder } from 'antd/es/table/interface';
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
            title: formatMessage({ id: 'businessAnalysis.sales.columns.keyword' }),
            dataIndex: 'keyword',
            valueType: 'text',
            hideInTable: true,
            hideInSearch: false,
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.id' }),
            dataIndex: 'id',
            key: 'id',
            width: 100,
            sorter: true,
            hideInSearch: true
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.name' }),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            hideInSearch: true
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.firstSeen' }),
            dataIndex: 'first_seen',
            key: 'first_seen',
            valueType: 'dateTime',
            width: 180,
            sorter: true,
            hideInSearch: true
        },
        {
            title: formatMessage({ id: 'imvuGraph.users.columns.lastSeen' }),
            dataIndex: 'last_seen',
            key: 'last_seen',
            valueType: 'dateTime',
            width: 180,
            sorter: true,
            hideInSearch: true
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
                    search={{ filterType: 'light' }}
                    pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
                    request={async (params = {}, sort: Record<string, SortOrder | null> = {}) => {
                        const { current, pageSize, ...rest } = params as any;
                        const order: INSIGHT_API.OrderItem[] = Object.keys(sort).length
                            ? Object.entries(sort).map(([property, direction]) => ({
                                property,
                                direction: direction === 'ascend' ? 'ASC' : direction === 'descend' ? 'DESC' : undefined,
                            }))
                            : [];
                        try {
                            const body: INSIGHT_API.PaginationParams = {
                                page: current || 1,
                                page_size: pageSize || 10,
                                orders: order,
                                // include other params if needed
                                ...rest,
                            } as unknown as INSIGHT_API.PaginationParams;
                            const res = await listImvuUsers(body);
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
