import React from 'react';
import { Space } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { SelectLang, useIntl } from '@umijs/max';
import HeaderDropdown from './HeaderDropdown';

const handleLogout = () => {
  try {
    localStorage.clear();
  } finally {
    window.location.href = '/login';
  }
};

const AccountMenu: React.FC = () => {
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
    <Space size="middle">
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
