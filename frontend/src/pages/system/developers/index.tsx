import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const Developers: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'system.developers.pageTitle', defaultMessage: 'Developers' })} - ${formatMessage({ id: 'app.name', defaultMessage: 'IMVU Insight' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'system.developers.pageTitle', defaultMessage: 'Developers' })} />
		</>
	);
};

export default Developers;
