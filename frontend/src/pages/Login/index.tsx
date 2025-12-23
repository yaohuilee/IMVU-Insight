import { history, SelectLang, useIntl } from '@umijs/max';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Form, theme } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

type LoginFormValues = {
    username: string;
    password: string;
    rememberUsername: boolean;
};

const STORAGE_KEY = 'imvu-insight.remembered-username';

const Login: React.FC = () => {
    const { token } = theme.useToken();
    const { formatMessage } = useIntl();
    const [form] = Form.useForm<LoginFormValues>();

    const title = `${formatMessage({ id: 'login.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

    const rememberedUsername = useMemo(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) ?? '';
        } catch {
            return '';
        }
    }, []);

    useEffect(() => {
        form.setFieldsValue({
            username: rememberedUsername,
            rememberUsername: Boolean(rememberedUsername),
        });
    }, [form, rememberedUsername]);

    const onFinish = async (values: LoginFormValues) => {
        if (values.rememberUsername) {
            try {
                localStorage.setItem(STORAGE_KEY, values.username);
            } catch {
                // ignore storage errors
            }
        } else {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch {
                // ignore storage errors
            }
        }

        history.push('/dashboard');
        return true;
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                backgroundColor: token.colorBgLayout,
            }}
        >
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <SelectLang />
            </div>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <LoginForm<LoginFormValues>
                form={form}
                title={formatMessage({ id: 'login.title' })}
                subTitle={formatMessage({ id: 'login.subTitle' })}
                submitter={{
                    searchConfig: {
                        submitText: formatMessage({ id: 'login.submit' }),
                    },
                }}
                onFinish={onFinish}
                initialValues={{
                    username: '',
                    password: '',
                    rememberUsername: false,
                }}
            >
                <ProFormText
                    name="username"
                    fieldProps={{
                        size: 'large',
                        autoComplete: 'username',
                        prefix: <UserOutlined />,
                    }}
                    placeholder={formatMessage({ id: 'login.username' })}
                    rules={[{ required: true, message: formatMessage({ id: 'login.username.required' }) }]}
                />

                <ProFormText.Password
                    name="password"
                    fieldProps={{
                        size: 'large',
                        autoComplete: 'current-password',
                        prefix: <LockOutlined />,
                    }}
                    placeholder={formatMessage({ id: 'login.password' })}
                    rules={[{ required: true, message: formatMessage({ id: 'login.password.required' }) }]}
                />

                <ProFormCheckbox name="rememberUsername">
                    {formatMessage({ id: 'login.rememberUsername' })}
                </ProFormCheckbox>
            </LoginForm>
        </div>
    );
};

export default Login;
