
import React, { useState, useEffect } from 'react'
import { Tabs, Layout, Button, Menu, Switch } from 'antd';
import Flood from '../Flood';
import Visualcamera from '../Visualcamera';
import { useSubscribe, useUnsubscribe } from '@/utils/usePubSub';

import {
  SettingOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined,  NodeIndexOutlined
} from '@ant-design/icons';
import './index.css';

const { TabPane } = Tabs;
const { SubMenu } = Menu;
const { Sider, Content } = Layout;

export default function Panelpage() {


  const unsubscribe = useUnsubscribe();//清除更新组件重复订阅的副作用
  //定义Hooks
  const [collapsed, setCollapsed] = useState(true);

  //缩小sidebar
  function toggleCollapsed() {
    setCollapsed(!collapsed);
  };


  function handleClick(e) {
    setactivepage(e.key)
  }
  const menu = (<Sider
    collapsed={collapsed}
    onCollapse={toggleCollapsed}
    theme='light'
  >
    <Menu 
      mode="inline"
      onClick={handleClick}
      defaultSelectedKeys={['Flood']}
      style={{
        borderRight: 0,
        'overflowX': 'hidden',
        'overflowY': 'auto'
      }}
    >
      <SubMenu key="sub1" icon={<NodeIndexOutlined />} title="洪涝灾害分析">
        <Menu.Item key="Flood" icon={<NodeIndexOutlined />}>洪涝灾害分析</Menu.Item>
      </SubMenu>
      <SubMenu key="sub2" icon={<SettingOutlined />} title="设置">
        <Menu.Item key="Visualcamera" icon={<span className="iconfont icon-vedio" />}>视角设置</Menu.Item>
      </SubMenu>
    </Menu>
    <Button type="text" onClick={toggleCollapsed} style={{ margin: '10px 16px' }}>
      {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
    </Button>
  </Sider>

  )
  const [activepage, setactivepage] = useState('Flood')

  //订阅activepage，检测到activepage一但改变，就更新tab
  unsubscribe('activepage')
  useSubscribe('activepage', function (msg: any, data: any) {
    setactivepage(data)
  });


  return (
    <Layout>
      <Content>
        <Tabs tabPosition="left" size='small' renderTabBar={(a, b) => menu} activeKey={activepage}>
          <TabPane key="Flood" >
            <Flood />
          </TabPane>
          <TabPane key="Visualcamera" >
            <Visualcamera />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>


  )

}
