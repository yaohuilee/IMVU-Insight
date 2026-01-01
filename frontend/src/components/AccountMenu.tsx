import React from 'react';
import { Space } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { SelectLang, useIntl } from '@umijs/max';
import HeaderDropdown from './HeaderDropdown';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';

type AccountMenuProps = {
  collapsed?: boolean;
};

const handleLogout = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } finally {
    const base = (window as any).routerBase || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const loginPath = `${normalizedBase}login`;

    const { pathname, search } = window.location;
    const redirectTarget = `${pathname}${search}`;
    const url = redirectTarget
      ? `${loginPath}?redirect=${encodeURIComponent(redirectTarget)}`
      : loginPath;

    window.location.href = url;
  }
};

const AccountMenu: React.FC<AccountMenuProps> = ({ collapsed }) => {
  const intl = useIntl();

  const items = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: (
        <span style={{ marginLeft: 8 }}>
          {intl.formatMessage({ id: 'component.account.logout', defaultMessage: 'Logout' })}
        </span>
      ),
    },
  ];

  const dropdownMenuProps = {
    items,
    onClick: (info: any) => {
      if (info?.key === 'logout') {
        handleLogout();
      }
    },
  } as any;

  return (
    <Space
      size="middle"
      direction={collapsed ? 'vertical' : 'horizontal'}
      align="center"
      style={{ paddingBottom: collapsed ? 16 : 0 }}
    >
      <SelectLang />
      <HeaderDropdown menu={dropdownMenuProps} placement="bottomRight">
        <span aria-label="account" style={{ cursor: 'pointer', color: 'inherit' }}>
          <UserOutlined />
        </span>
      </HeaderDropdown>
    </Space>
  );
};

export default AccountMenu;
