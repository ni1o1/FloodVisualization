import React, { useEffect, useState, useCallback } from 'react'
import { Col, Card, Row, Collapse, Slider, Tooltip } from 'antd';
import {
    InfoCircleOutlined
} from '@ant-design/icons';

//redux
import { useDispatch, useMappedState } from 'redux-react-hook'
import {
    setwaterheight_tmp
} from '@/redux/actions/traj'



const { Panel } = Collapse;
export default function Hourlytraj() {

    /*
  ---------------redux中取出变量---------------
*/
    //#region
    const mapState = useCallback(
        state => ({
            traj: state.traj
        }),
        []
    );
    const { traj } = useMappedState(mapState);
    const { waterheight } = traj
    //dispatch

    const dispatch = useDispatch()
    const setwaterheight = (data) => {
        dispatch(setwaterheight_tmp(data))
    }
    const handlechange = (data) => {

        setwaterheight(data)
    }

    return (
        <>
            <Col span={24}>
                <Card title="洪涝灾害分析" extra={<Tooltip title='Click on the bars to show trajectories.'><InfoCircleOutlined /></Tooltip>}
                    bordered={false}>
                    <Collapse defaultActiveKey={['Trajectory-Echarts-1']}>
                        <Panel header="降雨量" key="Trajectory-Echarts-1">
                            <Row>
                                <Col span={4}>水平面</Col>
                                <Col span={12}>
                                    <Slider
                                        min={0}
                                        max={10}
                                        step={0.01}
                                        value={typeof waterheight === 'number' ? waterheight : 0}
                                        onChange={handlechange}
                                    />
                                </Col>
                                <Col span={6}>{waterheight}m</Col>
                            </Row>
                        </Panel>
                    </Collapse>
                </Card>
            </Col>
        </>
    )

}