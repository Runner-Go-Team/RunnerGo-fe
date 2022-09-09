import React, { useEffect, useState } from 'react';
import { Scale, Drawer, Input, Button } from 'adesign-react';
import { Close as SvgClose } from 'adesign-react/icons'
import { useSelector } from 'react-redux';
import { isObject } from 'lodash';
import Bus from '@utils/eventBus';
import TreeMenu from '@components/TreeMenu';
import { ApisWrapper, ApiManageWrapper } from './style';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import SceneHeader from '@pages/Scene/sceneHeader';
import SceneContainer from '@pages/Scene/sceneContainer';
import DetailHeader from './header';
import TaskConfig from './taskConfig';
import { global$ } from '@hooks/useGlobal/global';
import ApiPicker from '@pages/Scene/sceneContainer/apiPicker';
import ApiManage from '@pages/ApisWarper/modules/ApiManage';
import ScenePicker from './scenePicker';

const { ScalePanel, ScaleItem } = Scale;

const PlanDetail = () => {

    const { id } = useParams();
    const [sceneName, setSceneName] = useState('');
    const [importApi, setImportApi] = useState(false);
    const [importScene, setImportScene] = useState(false);
    const [configApi, setConfigApi] = useState(false);
    const open_plan_scene = useSelector((store) => store.plan.open_plan_scene);
    const api_now = useSelector((store) => store.plan.api_now);
    const apiConfig = useSelector((store) => store.plan.showApiConfig);

    const [apiName, setApiName] = useState(api_now ? api_now.name : '新建接口');
    console.log(id);

    useEffect(() => {
        console.log('RELOAD_LOCAL_PLAN');
        global$.next({
            action: 'RELOAD_LOCAL_PLAN',
            id,
        });
    }, []);

    useEffect(() => {
        setConfigApi(apiConfig);
    }, [apiConfig])

    useEffect(() => {
        setApiName(api_now.name)
    }, [api_now])

    const onTargetChange = (type, value) => {
        console.log(api_now);
        Bus.$emit('updateSceneApi', {
            id: api_now.id,
            pathExpression: getPathExpressionObj(type),
            value,
        }, id_apis);
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

    return (
        <>
            <DetailHeader />
            {importApi && <ApiPicker onCancel={() => setImportApi(false)} />}
            {importScene && <ScenePicker onCancel={() => setImportScene(false)} />}
            {
               configApi && <Drawer
                    visible={true}
                    title={<DrawerHeader />}
                    onCancel={() => setDrawer(false)}
                    footer={null}
                    mask={false}
                >
                    <ApiManage from="plan" apiInfo={api_now} showInfo={false} onChange={(type, val) => onTargetChange(type, val)} />
                </Drawer>
            }
            <ScalePanel
                style={{ marginTop: '2px' }}
                realTimeRender
                className={ApisWrapper}
                defaultLayouts={{ 0: { width: 280 }, 1: { width: 905, flex: 1 }, 2: { width: 630 } }}
            >
                <ScaleItem className="left-menus" minWidth={250} maxWidth={350}>
                    <TreeMenu type='plan' plan_id={id} getSceneName={(e) => setSceneName(e)} onChange={(e) => setImportScene(e)} />
                </ScaleItem>
                <ScaleItem className="right-apis" enableScale={true}>
                    {
                        Object.entries(open_plan_scene).length > 0 ? <>
                            <SceneHeader from='plan' sceneName={sceneName} />
                            <SceneContainer from='plan' onChange={(type, e) => {
                                console.log(type, e);
                                if (type === 'api') {
                                    setImportApi(e)
                                } else if (type === 'scene') {
                                    setImportScene(e)
                                }
                            }} />
                        </> : <p className='empty'>还没有数据</p>
                    }
                </ScaleItem>
                <ScaleItem enableScale={true}>
                    <TaskConfig />
                </ScaleItem>
            </ScalePanel>
        </>
    )
};

export default PlanDetail;