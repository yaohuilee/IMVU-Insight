import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const Products: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'businessAnalysis.products.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'businessAnalysis.products.pageTitle' })} />
		</>
	);
};

export default Products;
