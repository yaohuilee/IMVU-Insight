import React from 'react';
import { useRef, useState } from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { Tabs } from 'antd';
import DataImport from './components/DataImport';
import ImportHistory from './components/ImportHistory';
import type { ActionType } from '@ant-design/pro-table';

const DataSync: React.FC = () => {
    const { formatMessage } = useIntl();
    const title = `${formatMessage({ id: 'dataSync.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

    const [activeKey, setActiveKey] = useState<string>('import');
    const historyActionRef = useRef<ActionType | undefined>();

    return (
        <>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <PageContainer title={formatMessage({ id: 'dataSync.pageTitle' })} >
                <ProCard bordered>
                    <Tabs
                        activeKey={activeKey}
                        onChange={(k) => setActiveKey(k)}
                        items={[
                            {
                                key: 'import',
                                label: formatMessage({ id: 'dataSync.uploadTitle' }),
                                children: (
                                    <DataImport
                                        onImport={() => {
                                            setActiveKey('history');
                                            // reload history table
                                            historyActionRef.current?.reload?.();
                                        }}
                                    />
                                ),
                            },
                            {
                                key: 'history',
                                label: formatMessage({ id: 'dataSync.tableTitle' }),
                                children: <ImportHistory actionRef={historyActionRef} />,
                            },
                        ]}
                    />
                </ProCard>
            </PageContainer>
        </>
    );
};

export default DataSync;
