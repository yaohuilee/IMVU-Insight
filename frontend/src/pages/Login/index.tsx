import { history, SelectLang, useIntl } from '@umijs/max';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Form, message, theme } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { currentUser, login as loginApi } from '@/services/insight/auth';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';

type LoginFormValues = {
    username: string;
    password: string;
    rememberUsername: boolean;
};

const STORAGE_KEY = 'imvu-insight.remembered-username';

const hashPassword = async (password: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.crypto?.subtle) return password;

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

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

    useEffect(() => {
        const hasAccessToken = (() => {
            try {
                return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
            } catch {
                return false;
            }
        })();

        if (!hasAccessToken) return;

        const redirect = new URLSearchParams(history.location?.search || '').get('redirect') || '/dashboard';

        const checkSession = async () => {
            try {
                await currentUser();
                history.push(redirect);
            } catch (err: any) {
                // ignore 401/404 to stay on login page
                const status = err?.response?.status;
                if (status === 401 || status === 404) return;
                // other errors surface to user
                message.error(formatMessage({ id: 'login.error', defaultMessage: 'Unable to login' }));
            }
        };

        checkSession();
    }, [formatMessage, form]);

    const onFinish = async (values: LoginFormValues) => {
        const password_hash = await hashPassword(values.password);

        try {
            const res = await loginApi({
                username: values.username,
                password_hash,
            });

            if (!res.success || !res.user?.access_token || !res.user.refresh_token) {
                message.error(formatMessage({ id: 'login.failed', defaultMessage: 'Login failed' }));
                try {
                    localStorage.removeItem(ACCESS_TOKEN_KEY);
                    localStorage.removeItem(REFRESH_TOKEN_KEY);
                } catch {
                    // ignore storage errors
                }
                return false;
            }

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

            try {
                localStorage.setItem(ACCESS_TOKEN_KEY, res.user.access_token);
                localStorage.setItem(REFRESH_TOKEN_KEY, res.user.refresh_token);
            } catch {
                // ignore storage errors
            }

            const redirect = new URLSearchParams(history.location?.search || '').get('redirect');
            history.push(redirect || '/dashboard');
            return true;
        } catch (error) {
            message.error(formatMessage({ id: 'login.error', defaultMessage: 'Unable to login' }));
            try {
                localStorage.removeItem(ACCESS_TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
            } catch {
                // ignore storage errors
            }
            return false;
        }
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
