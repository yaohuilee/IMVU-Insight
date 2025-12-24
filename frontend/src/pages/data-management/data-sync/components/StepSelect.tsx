import React, { useEffect, useState } from 'react';
import { ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Upload, Button, Space, Row, Spin, Typography } from 'antd';
import { Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { getDataSyncRecordByHash } from '@/services/insight/dataSync';

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
    const [duplicateRecord, setDuplicateRecord] = useState<INSIGHT_API.DataSyncRecordListItem | null>(null);
    const [checkingHash, setCheckingHash] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function checkHash() {
            if (!fileMeta?.hash) {
                setDuplicateRecord(null);
                return;
            }

            setCheckingHash(true);
            try {
                const res = await getDataSyncRecordByHash({ hash: fileMeta.hash });
                if (!mounted) return;
                if (res?.exists && res.record) {
                    setDuplicateRecord(res.record);
                } else {
                    setDuplicateRecord(null);
                }
            } catch (err) {
                setDuplicateRecord(null);
            } finally {
                if (mounted) setCheckingHash(false);
            }
        }

        checkHash();

        return () => {
            mounted = false;
        };
    }, [fileMeta?.hash]);

    return (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            <Row gutter={16}>
                <div style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text strong>{formatMessage({ id: 'dataSync.selectHint' })}</Text>
                            {selectedType && <div style={{ marginTop: 8 }}><Text type="secondary">{formatMessage({ id: 'dataSync.detected', defaultMessage: 'Detected:' })}</Text><Text code>{selectedType}</Text></div>}
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

            {duplicateRecord && (
                <div style={{ marginTop: 12 }}>
                    <Alert
                        type="warning"
                        showIcon
                        message={formatMessage({ id: 'dataSync.duplicateDetected', defaultMessage: 'This file appears to have been uploaded before' })}
                        description={
                            <div>
                                <div>
                                    <Text type="secondary">{formatMessage({ id: 'dataSync.typeLabel', defaultMessage: 'Type' })}: </Text>
                                    <Text>{duplicateRecord.type}</Text>
                                </div>
                                <div style={{ marginTop: 6 }}>
                                    <Text type="secondary">{formatMessage({ id: 'dataSync.uploadedAt', defaultMessage: 'Uploaded at' })}: </Text>
                                    <Text>{new Date(duplicateRecord.uploaded_at).toLocaleString()}</Text>
                                </div>
                                <div style={{ marginTop: 6 }}>
                                    <Text type="secondary">{formatMessage({ id: 'dataSync.recordCount', defaultMessage: 'Record count' })}: </Text>
                                    <Text>{duplicateRecord.record_count.toLocaleString()}</Text>
                                    <Text type="secondary"> &nbsp;·&nbsp; {formatMessage({ id: 'dataSync.fileSize', defaultMessage: 'File size' })}: </Text>
                                    <Text>{Math.round((duplicateRecord.file_size / 1024) * 100) / 100} KB</Text>
                                </div>
                            </div>
                        }
                    />
                </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                {computingHash && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <Text type="secondary">{formatMessage({ id: 'dataSync.hashing' })}</Text>
                    </span>
                )}
                {checkingHash && !computingHash && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <Text type="secondary">{formatMessage({ id: 'dataSync.checkingDuplicate', defaultMessage: 'Checking previous uploads' })}</Text>
                    </span>
                )}
                <Button type="primary" onClick={handleNextToPreview} disabled={computingHash || checkingHash || !!duplicateRecord}>{formatMessage({ id: 'dataSync.action.next' })}</Button>
            </div>
        </ProCard>
    );
};

export default StepSelect;
