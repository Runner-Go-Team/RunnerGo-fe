import React, { useState, useEffect } from 'react';
import './index.less';
import { Drawer, Button, Input, Modal } from 'adesign-react';
import { Close as SvgClose } from 'adesign-react/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SceneBox from './sceneBox';
import ApiManage from '@pages/ApisWarper/modules/ApiManage';
import { getPathExpressionObj } from '@constants/pathExpression';
import FooterConfig from './footerConfig';
import Bus from '@utils/eventBus';
import { useSelector, useDispatch } from 'react-redux';
import ApiPicker from './apiPicker';

const SceneContainer = () => {
    const apiConfig = useSelector((store) => store.scene.showApiConfig);
    const id_apis = useSelector((store) => store.scene.id_apis);
    const api_now = useSelector((store) => store.scene.api_now);
    const [showDrawer, setDrawer] = useState(false);
    const [showConfig, setConfig] = useState(true);
    const [showApiPicker, setApiPicker] = useState(false);
    const [apiName, setApiName] = useState(api_now ? api_now.name : '新建接口');
    const dispatch = useDispatch();

    useEffect(() => {
        setDrawer(apiConfig);
    }, [apiConfig])

    useEffect(() => {
        setApiName(api_now.name)
    }, [api_now])

    const closeApiConfig = () => {
        Bus.$emit('saveSceneApi', api_now, id_apis, () => {
            console.log(123);
            setDrawer(false)
            // dispatch({
            //     type: 'scene/updateApiConfig',
            //     payload: false
            // })
        });
        // if (api_now.is_changed) {
        //     Modal.confirm({
        //         title: '提示',
        //         content: '当前配置未保存是否确认关闭？',
        //         okText: '不保存',
        //         diyText: '保存并关闭',
        //         onDiy: async () => {
        //             Bus.$emit('saveSceneApi', api_now, () => {
        //                 dispatch({
        //                     type: 'scene/updateApiConfig',
        //                     payload: false
        //                 })
        //             },
        //             );
        //         },
        //         onOk: () => {
        //             dispatch({
        //                 type: 'scene/updateApiConfig',
        //                 payload: false
        //             })
        //         },
        //     });
        // } else {
        //     dispatch({
        //         type: 'scene/updateApiConfig',
        //         payload: false
        //     })
        // }
    };

    const DrawerHeader = () => {
        return (
            <div className='drawer-header'>
                <div className='drawer-header-left'>
                    <SvgClose width="16px" height="16px" onClick={(() => closeApiConfig())} />
                    <Input size="mini" value={apiName} placeholder="请输入接口名称" onChange={(e) => onTargetChange('name', e)} />
                </div>
                <Button onClick={() => {
                    Bus.$emit('saveSceneApi', api_now, id_apis);
                }}>保存</Button>
            </div>
        )
    };

    const onTargetChange = (type, value) => {
        console.log(api_now);
        Bus.$emit('updateSceneApi', {
            id: api_now.id,
            pathExpression: getPathExpressionObj(type),
            value,
        }, id_apis);
    }

    // api_now.url = 'http://localhost: 8888'

    return (
        <div className='scene-container'>
            {showApiPicker && <ApiPicker onCancel={() => setApiPicker(false)} />}
            {/* <DndProvider backend={HTML5Backend}> */}
            <SceneBox />
            {/* </DndProvider> */}
            <div className='api-config-drawer'>
                <Drawer
                    visible={showDrawer}
                    title={<DrawerHeader />}
                    onCancel={() => setDrawer(false)}
                    footer={null}
                    mask={false}
                >
                    <ApiManage apiInfo={api_now} showInfo={false} onChange={(type, val) => onTargetChange(type, val)} />
                </Drawer>
            </div>
            <FooterConfig onChange={(e) => setApiPicker(e)} />
        </div>
    )
};

export default SceneContainer;