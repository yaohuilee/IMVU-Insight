import React from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { listRecipients } from '@/services/insight/recipient';
import type { ProColumns } from '@ant-design/pro-components';

const Recipients: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'businessAnalysis.customers.recipients.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

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
			title: formatMessage({ id: 'businessAnalysis.customers.recipients.columns.receiveCount', defaultMessage: 'Receive Count' }),
			dataIndex: 'receive_count',
			key: 'receive_count',
			width: 120,
			align: 'right',
		},
		{
			title: formatMessage({ id: 'businessAnalysis.customers.recipients.columns.totalCredits', defaultMessage: 'Total Credits' }),
			dataIndex: 'total_credits',
			key: 'total_credits',
			width: 140,
			align: 'right',
			render: (val: any) => (val ? Number(val).toLocaleString() : val),
		},
		{
			title: formatMessage({ id: 'businessAnalysis.customers.recipients.columns.totalPromoCredits', defaultMessage: 'Total Promo Credits' }),
			dataIndex: 'total_promo_credits',
			key: 'total_promo_credits',
			width: 160,
			align: 'right',
			render: (val: any) => (val ? Number(val).toLocaleString() : val),
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
			render: (_: any, record: any) => (
				<Link to={`/business-analysis/customers/recipients/${record.id}`}>
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
			<PageContainer title={formatMessage({ id: 'businessAnalysis.customers.recipients.pageTitle' })}>
				<ProTable<INSIGHT_API.RecipientSummary>
					columns={columns}
					rowKey="id"
					search={false}
					pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
					request={async (params = {}) => {
						const { current, pageSize, ...rest } = params as any;
						try {
							const res = await listRecipients({ page: current || 1, page_size: pageSize || 10, ...rest });
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

export default Recipients;
