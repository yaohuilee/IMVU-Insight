import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';
import { Helmet } from 'react-helmet-async';

const EntityExplorer: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'imvuGraph.entityExplorer.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'imvuGraph.entityExplorer.pageTitle' })} />
		</>
	);
};

export default EntityExplorer;
