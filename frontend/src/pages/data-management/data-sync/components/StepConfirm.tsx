import React from 'react';
import { ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Row, Col, Alert, Form, Checkbox, Button, Space, Typography } from 'antd';

const { Text } = Typography;

type Props = {
    summary: any;
    form: any;
    handleConfirmImport: () => void;
    setCurrent: (n: number) => void;
};

const StepConfirm: React.FC<Props> = ({ summary, form, handleConfirmImport, setCurrent }) => {
    const { formatMessage } = useIntl();

    return (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
                <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col xs={24} md={12}>
                        <Text strong>Summary:</Text>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                            <div><Text>Total records: </Text><Text code>{summary?.total ?? '-'}</Text></div>
                            <div><Text>Record node: </Text><Text code>{summary?.recordName ?? '-'}</Text></div>
                        </div>
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: 'left' }}>
                        <Text strong style={{ marginRight: 8 }}>Attributes:</Text>
                        {summary?.rootAttrs && Object.keys(summary.rootAttrs).length > 0 && (
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap' }}>
                                {summary.rootAttrs.start_date && summary.rootAttrs.end_date ? (
                                    <div style={{ whiteSpace: 'nowrap' }}>
                                        <Text>start_date: </Text><Text code>{String(summary.rootAttrs.start_date)}</Text>
                                        <Text style={{ margin: '0 8px' }}>—</Text>
                                        <Text>end_date: </Text><Text code>{String(summary.rootAttrs.end_date)}</Text>
                                    </div>
                                ) : null}
                                {Object.entries(summary.rootAttrs as Record<string, any>).filter(([k]) => k !== 'start_date' && k !== 'end_date').map(([k, v]) => (
                                    <div key={k} style={{ whiteSpace: 'nowrap' }}><Text>{k}: </Text><Text code>{String(v)}</Text></div>
                                ))}
                            </div>
                        )}
                    </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                    <Alert type="warning" showIcon message={formatMessage({ id: 'dataSync.warning.overwrite' }) || 'Overwrite will replace existing snapshot and cannot be recovered.'} />
                </div>
            </div>

            <Form form={form} layout="vertical">
                <Form.Item name="overwrite" valuePropName="checked">
                    <Checkbox>{formatMessage({ id: 'dataSync.option.overwrite' })}</Checkbox>
                </Form.Item>
                <Form.Item name="dryRun" valuePropName="checked">
                    <Checkbox>{formatMessage({ id: 'dataSync.option.dryRun' })}</Checkbox>
                </Form.Item>
            </Form>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrent(1)}>{formatMessage({ id: 'dataSync.action.back' }) || 'Back'}</Button>
                <Space>
                    <Button onClick={() => setCurrent(0)}>{formatMessage({ id: 'dataSync.action.modify' }) || 'Back to Modify'}</Button>
                    <Button type="primary" onClick={handleConfirmImport}>{formatMessage({ id: 'dataSync.action.confirm' }) || 'Confirm Import'}</Button>
                </Space>
            </div>
        </ProCard>
    );
};

export default StepConfirm;
