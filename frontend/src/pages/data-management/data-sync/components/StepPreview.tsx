import React from 'react';
import { ProCard, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Row, Col, Button, Alert, Typography } from 'antd';

const { Text } = Typography;

type PreviewRow = Record<string, any>;

type Props = {
    parseError: string | null;
    summary: any;
    previewRows: PreviewRow[];
    columns: any[];
    setCurrent: (n: number) => void;
};

const StepPreview: React.FC<Props> = ({ parseError, summary, previewRows, columns, setCurrent }) => {
    const { formatMessage } = useIntl();

    return (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            {parseError && <Alert type="error" message={parseError} />}
            {!parseError && summary && (
                <div>
                    <div style={{ marginBottom: 12 }}>
                        <Row gutter={16} style={{ marginTop: 8 }}>
                            <Col xs={24} md={12}>
                                <Text strong>Summary:</Text>
                                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                                    <div><Text>Total records: </Text><Text code>{summary.total}</Text></div>
                                    <div><Text>Record node: </Text><Text code>{summary.recordName}</Text></div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} style={{ textAlign: 'left' }}>
                                <Text strong style={{ marginRight: 8 }}>Attributes:</Text>
                                {summary.rootAttrs && Object.keys(summary.rootAttrs).length > 0 && (
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {summary.rootAttrs.start_date && summary.rootAttrs.end_date ? (
                                            <div style={{ whiteSpace: 'nowrap' }}>
                                                <Text>start_date: </Text><Text code>{summary.rootAttrs.start_date}</Text>
                                                <Text style={{ margin: '0 8px' }}>—</Text>
                                                <Text>end_date: </Text><Text code>{summary.rootAttrs.end_date}</Text>
                                            </div>
                                        ) : null}
                                        {Object.entries(summary.rootAttrs as Record<string, any>).filter(([k]) => k !== 'start_date' && k !== 'end_date').map(([k, v]) => (
                                            <div key={k} style={{ whiteSpace: 'nowrap' }}><Text>{k}: </Text><Text code>{String(v)}</Text></div>
                                        ))}
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <ProTable<PreviewRow>
                            rowKey={(r) => JSON.stringify(r).slice(0, 36)}
                            search={false}
                            pagination={{ pageSize: 10 }}
                            dataSource={previewRows}
                            columns={columns.map(c => ({ title: c.title, dataIndex: c.dataIndex }))}
                            options={false}
                            scroll={{ x: 'max-content' }}
                        />
                    </div>
                </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrent(0)}>{formatMessage({ id: 'dataSync.action.back' })}</Button>
                <Button type="primary" onClick={() => setCurrent(2)} disabled={!summary}>{formatMessage({ id: 'dataSync.action.next' })}</Button>
            </div>
        </ProCard>
    );
};


export default StepPreview;
