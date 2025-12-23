import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const Sales: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'businessAnalysis.sales.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'businessAnalysis.sales.pageTitle' })} />
		</>
	);
};

export default Sales;
