import React from 'react';
import { Empty } from 'antd';
import { ProCard } from '@ant-design/pro-components';

const CashTab: React.FC = () => {
    return (
        <ProCard>
            <Empty description={"Cash records coming soon"} />
        </ProCard>
    );
};

export default CashTab;
