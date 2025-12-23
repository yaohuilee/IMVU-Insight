import { history } from '@umijs/max';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Form, theme } from 'antd';
import React, { useEffect, useMemo } from 'react';

type LoginFormValues = {
    username: string;
    password: string;
    rememberUsername: boolean;
};

const STORAGE_KEY = 'imvu-insight.remembered-username';

const Login: React.FC = () => {
    const { token } = theme.useToken();
    const [form] = Form.useForm<LoginFormValues>();

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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                backgroundColor: token.colorBgLayout,
            }}
        >
            <LoginForm<LoginFormValues>
                form={form}
                title="IMVU Insight"
                subTitle="Sign in with your username and password"
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
                    placeholder="Username"
                    rules={[{ required: true, message: 'Please enter your username.' }]}
                />

                <ProFormText.Password
                    name="password"
                    fieldProps={{
                        size: 'large',
                        autoComplete: 'current-password',
                        prefix: <LockOutlined />,
                    }}
                    placeholder="Password"
                    rules={[{ required: true, message: 'Please enter your password.' }]}
                />

                <ProFormCheckbox name="rememberUsername">Remember username</ProFormCheckbox>
            </LoginForm>
        </div>
    );
};

export default Login;
