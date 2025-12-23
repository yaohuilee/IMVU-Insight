export default [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    layout: false,
    component: './Login',
  },
  {
    name: 'Dashboard',
    icon: 'DashboardOutlined',
    path: '/dashboard',
    component: './Dashboard',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
