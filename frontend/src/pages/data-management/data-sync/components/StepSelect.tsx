import React from 'react';
import { ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Upload, Button, Space, Row, Spin, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { Text } = Typography;

type Props = {
    beforeUpload: (f: UploadFile) => any;
    handleNextToPreview: () => void;
    handleRemove: () => void;
    file: File | null;
    fileMeta: { name: string; size: number; modified?: number; hash?: string } | null;
    computingHash: boolean;
    selectedType: 'Product' | 'Income' | null;
};

const StepSelect: React.FC<Props> = ({ beforeUpload, handleNextToPreview, handleRemove, file, fileMeta, computingHash, selectedType }) => {
    const { formatMessage } = useIntl();

    return (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            <Row gutter={16}>
                <div style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text strong>{formatMessage({ id: 'dataSync.selectHint' })}</Text>
                            {selectedType && <div style={{ marginTop: 8 }}><Text type="secondary">Detected: </Text><Text code>{selectedType}</Text></div>}
                        </div>

                        <Dragger accept=".xml,.csv" beforeUpload={beforeUpload} fileList={file ? [{ uid: '1', name: file.name, size: file.size }] : []} onRemove={handleRemove} showUploadList={false}>
                            <div style={{ textAlign: 'center' }}>
                                {!file ? (
                                    <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                ) : null}
                                {!file ? (
                                    <p className="ant-upload-text">{formatMessage({ id: 'dataSync.uploadHint' })}</p>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0, flex: '0 0 auto' }}>
                                            <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                            <div style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                <Text strong>{file.name}</Text>
                                            </div>
                                        </div>
                                        <div style={{ marginLeft: 16, textAlign: 'left' }}>
                                            <div><Text type="secondary">{Math.round((file.size / 1024) * 100) / 100} KB</Text></div>
                                            <div style={{ marginTop: 4 }}>
                                                <Text type="secondary">{file?.lastModified ? new Date(file.lastModified).toLocaleString() : (fileMeta?.modified ? new Date(fileMeta.modified).toLocaleString() : '')}</Text>
                                            </div>
                                            {fileMeta?.hash && (
                                                <div style={{ marginTop: 8 }}>
                                                    <Text type="secondary">Hash (SHA-256): </Text>
                                                    <Text code style={{ wordBreak: 'break-all' }}>{fileMeta.hash}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Dragger>
                    </Space>
                </div>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                {computingHash && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <Text type="secondary">{formatMessage({ id: 'dataSync.hashing' }) || 'Computing file hash...'}</Text>
                    </span>
                )}
                <Button type="primary" onClick={handleNextToPreview} disabled={computingHash}>{formatMessage({ id: 'dataSync.action.next' }) || 'Next'}</Button>
            </div>
        </ProCard>
    );
};

export default StepSelect;
