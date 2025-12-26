import React from 'react';
import { PageContainer, ProTable, ProColumns } from '@ant-design/pro-components';
import type { SortOrder } from 'antd/es/table/interface';
import { Link, useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { listProducts } from '../../../services/insight/product';

const Products: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'businessAnalysis.products.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

	const columns: ProColumns<any>[] = [
		{
			title: formatMessage({ id: 'businessAnalysis.products.columns.id', defaultMessage: 'ID' }),
			dataIndex: 'id',
			width: 80,
			sorter: true,
		},
		{
			title: formatMessage({ id: 'businessAnalysis.products.columns.name', defaultMessage: 'Name' }),
			dataIndex: 'name',
			ellipsis: true,
			sorter: true,
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
			sorter: true,
		},
		{
			align: 'center',
			title: formatMessage({ id: 'businessAnalysis.products.columns.firstSold', defaultMessage: 'First Sold' }),
			dataIndex: 'first_sold_at',
			valueType: 'dateTime',
			width: 180,
			sorter: true,
		},
		{
			align: 'center',
			title: formatMessage({ id: 'businessAnalysis.products.columns.lastSold', defaultMessage: 'Last Sold' }),
			dataIndex: 'last_sold_at',
			valueType: 'dateTime',
			width: 180,
			sorter: true,
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
				<ProTable<INSIGHT_API.ProductSummary>
					columns={columns}
					rowKey="product_id"
					request={async (params = {}, sort: Record<string, SortOrder | null> = {}) => {
						const { current, pageSize, ...rest } = params as any;
						const order: INSIGHT_API.OrderItem[] = Object.keys(sort).length
							? Object.entries(sort).map(([property, direction]) => ({
								  property,
								  direction: direction === 'ascend' ? 'ASC' : direction === 'descend' ? 'DESC' : undefined,
							  }))
							: [];
						const res = await listProducts({
							page: current || 1,
							page_size: pageSize || 10,
							orders: order,
							...rest,
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
