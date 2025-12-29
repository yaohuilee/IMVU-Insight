import React from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { SortOrder } from 'antd/es/table/interface';
import { Link, useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { listBuyers } from '@/services/insight/buyer';
import type { ProColumns } from '@ant-design/pro-components';

const Buyers: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'businessAnalysis.customers.buyers.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

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
			hideInSearch: true,
		},
		{
			title: formatMessage({ id: 'imvuGraph.users.columns.name' }),
			dataIndex: 'name',
			key: 'name',
			sorter: true,
			hideInSearch: true,
		},
		{
			title: formatMessage({ id: 'businessAnalysis.customers.buyers.columns.buyCount', defaultMessage: 'Buy Count' }),
			dataIndex: 'buy_count',
			key: 'buy_count',
			width: 120,
			align: 'right',
			sorter: true,
			hideInSearch: true,
		},
		{
			title: formatMessage({ id: 'businessAnalysis.customers.buyers.columns.totalCredits', defaultMessage: 'Total Credits' }),
			dataIndex: 'total_credits',
			key: 'total_credits',
			width: 140,
			align: 'right',
			render: (val: any) => (val ? Number(val).toLocaleString() : val),
			sorter: true,
			hideInSearch: true,
		},
		{
			title: formatMessage({ id: 'businessAnalysis.customers.buyers.columns.totalPromoCredits', defaultMessage: 'Total Promo Credits' }),
			dataIndex: 'total_promo_credits',
			key: 'total_promo_credits',
			width: 160,
			align: 'right',
			render: (val: any) => (val ? Number(val).toLocaleString() : val),
			sorter: true,
			hideInSearch: true,
		},
		{
			title: formatMessage({ id: 'imvuGraph.users.columns.firstSeen' }),
			dataIndex: 'first_seen',
			key: 'first_seen',
			valueType: 'dateTime',
			width: 180,
			sorter: true,
			hideInSearch: true,
		},
		{
			title: formatMessage({ id: 'imvuGraph.users.columns.lastSeen' }),
			dataIndex: 'last_seen',
			key: 'last_seen',
			valueType: 'dateTime',
			width: 180,
			sorter: true,
			hideInSearch: true,
		},
		{
			align: 'center',
			title: formatMessage({ id: 'imvuGraph.users.columns.action' }),
			dataIndex: 'action',
			valueType: 'option',
			width: 80,
			render: (_: any, record: any) => (
				<Link to={`/business-analysis/customers/buyers/${record.id}`}>
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
			<PageContainer title={formatMessage({ id: 'businessAnalysis.customers.buyers.pageTitle' })}>
				<ProTable<INSIGHT_API.BuyerSummary>
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
							const res = await listBuyers({ page: current || 1, page_size: pageSize || 10, orders: order, ...rest });
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

export default Buyers;
