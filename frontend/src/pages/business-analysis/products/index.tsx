import React from 'react';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { listProducts } from '../../../services/insight/product';

const Products: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'businessAnalysis.products.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

	const columns: ProColumns<any>[] = [
		{
			title: formatMessage({ id: 'businessAnalysis.products.columns.id', defaultMessage: 'ID' }),
			dataIndex: 'product_id',
			width: 80,
		},
		{
			title: formatMessage({ id: 'businessAnalysis.products.columns.name', defaultMessage: 'Name' }),
			dataIndex: 'product_name',
			ellipsis: true,
		},
		{
			align: 'center',
			title: formatMessage({ id: 'businessAnalysis.products.columns.visible', defaultMessage: 'Visible' }),
			dataIndex: 'visible',
			valueType: 'switch',
			width: 80,
		},
		{
			align: 'right',
			title: formatMessage({ id: 'businessAnalysis.products.columns.price', defaultMessage: 'Price' }),
			dataIndex: 'price',
			width: 80,
		},
		{
			align: 'center',
			title: formatMessage({ id: 'businessAnalysis.products.columns.firstSold', defaultMessage: 'First Sold' }),
			dataIndex: 'first_sold_at',
			valueType: 'dateTime',
			width: 180,
		},
		{
			align: 'center',
			title: formatMessage({ id: 'businessAnalysis.products.columns.lastSold', defaultMessage: 'Last Sold' }),
			dataIndex: 'last_sold_at',
			valueType: 'dateTime',
			width: 180,
		},
		 {
		   align: 'center',
		   title: formatMessage({ id: 'businessAnalysis.products.columns.action' }),
		   dataIndex: 'action',
		   valueType: 'option',
		   width: 80,
		   render: (_, record) => (
		     <Link to={`/business-analysis/products/${record.product_id}`}>
		       {formatMessage({ id: 'businessAnalysis.products.action.detail' })}
		     </Link>
		   ),
		 }
	];

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'businessAnalysis.products.pageTitle' })}>
				<ProTable<INSIGHT_API.app_routes_product_ProductSummary>
					columns={columns}
					rowKey="product_id"
					request={async (params = { current: 1, pageSize: 10 }) => {
						const res = await listProducts({
							page: params.current,
							page_size: params.pageSize,
						} as any);
						const data = res?.items ?? res?.items ?? [];
						const total = res?.total ?? res?.total ?? 0;
						return {
							data,
							total,
							success: true,
						};
					}}
					pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
					search={false}
				/>
			</PageContainer>
		</>
	);
};

export default Products;
