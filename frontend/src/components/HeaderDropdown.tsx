import React from 'react';
import { Dropdown } from 'antd';
import { DropDownProps } from 'antd/es/dropdown';

export interface HeaderDropdownProps extends DropDownProps {
  overlayClassName?: string;
}

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
  overlayClassName: cls,
  children,
  ...restProps
}) => (
  <Dropdown overlayClassName={cls} {...restProps}>
    {children as any}
  </Dropdown>
);

export default HeaderDropdown;
