import React, { useEffect, useState } from 'react';
import { Scale } from 'adesign-react';
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
import ScenePicker from './scenePicker';

const { ScalePanel, ScaleItem } = Scale;

const PlanDetail = () => {

    const { id } = useParams();
    const [sceneName, setSceneName] = useState('');
    const [importApi, setImportApi] = useState(false);
    const [importScene, setImportScene] = useState(false);
    const open_plan_scene = useSelector((store) => store.plan.open_plan_scene);
    console.log(id);

    useEffect(() => {
        console.log('RELOAD_LOCAL_PLAN');
        global$.next({
            action: 'RELOAD_LOCAL_PLAN',
            id,
        });
    }, [])
    return (
        <>
            <DetailHeader />
            {importApi && <ApiPicker onCancel={() => setImportApi(false)} />}
            {importScene && <ScenePicker onCancel={() => setImportScene(false)} /> }
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