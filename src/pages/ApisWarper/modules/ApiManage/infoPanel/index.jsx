import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Message, Dropdown } from 'adesign-react';
import { Right as SvgRight, Down as SvgDown } from 'adesign-react/icons';
import ApiStatus from '@components/ApiStatus';
import APIModal from '@components/ApisDescription';
import ManageGroup from '@components/ManageGroup';
// import { TYPE_MODAL_TYPE } from './types';
import Bus from '@utils/eventBus';
import './index.less';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHandleApi } from '@services/apis';
import { cloneDeep } from 'lodash';
import { tap } from 'rxjs';
import { global$ } from '@hooks/useGlobal/global';
import { useTranslation } from 'react-i18next';
import Mousetrap from 'mousetrap';
import 'mousetrap-global-bind';
import useFolders from '@hooks/useFolders';
import { DropWrapper } from './style';


const ApiInfoPanel = (props) => {
    const { data, showGenetateCode, onChange, from = 'apis', onSave } = props;

    const refDropdown = useRef();
    const [modalType, setModalType] = useState('');
    const { open_apis, open_api_now } = useSelector((store) => store.opens);
    const { t } = useTranslation();
    const {
        id_apis: id_apis_scene,
        id_now: id_now_scene,
    } = useSelector((store) => store.scene);
    const {
        id_apis: id_apis_plan,
        id_now: id_now_plan
    } = useSelector((store) => store.plan);
    const { apiFolders } = useFolders();

    const apiDataList = {
        'apis': open_apis,
        'scene': id_apis_scene,
        'plan': id_apis_plan,
    };
    const apiNowList = {
        'apis': open_api_now,
        'scene': id_now_scene,
        'plan': id_now_plan,
    };

    const apiData = apiDataList[from];
    const apiNow = apiNowList[from];

    const dispatch = useDispatch();

    const _saveId = useSelector((store) => store.opens.saveId);

    Mousetrap.bindGlobal(['command+s', 'ctrl+s'], () => {
        saveApi();
        return false;
    });


    console.log(apiFolders);

    // const keyDown = (e) => {
    //     if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)){
    //         e.preventDefault();
    //         console.log(111);
    //         saveApi();
    //      }
    // }

    // useEffect(() => {

    //     document.addEventListener('keydown', keyDown);

    //     return () => {
    //         document.removeEventListener('keydown', keyDown);
    //     }
    // }, []);

    const saveApi = (pid) => {
        if (from === 'scene' || from === 'plan') {
            Bus.$emit('saveSceneApi', apiNow, apiData)
        } else {
            console.log(123123);
            Bus.$emit('saveTargetById', {
                id: apiNow,
                saveId: _saveId,
                pid: pid ? pid : 0
            }, {}, (code, id) => {

                if (code === 0) {
                    Message('success', t('message.saveSuccess'));
                    // onSave(id);
                    dispatch({
                        type: 'opens/updateSaveId',
                        payload: id,
                    })
                    // dispatch({
                    //     type: 'opens/updateOpenApiNow',
                    //     payload: id,
                    // })
                } else {
                    Message('error', t('message.saveError'));
                }
            });
            return;
            const _apiData = cloneDeep(apiData[apiNow]);
            if (typeof _apiData.target_id === 'string') {
                delete _apiData['target_id'];
                _apiData.parent_id = parseInt(apiData.parent_id);
                _apiData.team_id = parseInt(localStorage.getItem('team_id'));
            }

            _apiData.is_changed = -1;
            fetchHandleApi(_apiData)
                .pipe(
                    tap((res) => {
                        const { data: { target_id }, code } = res;
                        if (code === 0) {
                            Message('success', '????????????!');
                            const tempApiData = cloneDeep(open_apis);
                            const _tempApiData = tempApiData[open_api_now];
                            delete tempApiData[open_api_now];
                            tempApiData[target_id] = _tempApiData;
                            tempApiData[target_id].is_changed = -1;
                            tempApiData[target_id].target_id = target_id;
                            dispatch({
                                type: 'opens/coverOpenApis',
                                payload: tempApiData
                            });
                            dispatch({
                                type: 'opens/updateOpenApiNow',
                                payload: target_id,
                            });
                            Bus.$emit('updateTargetId', target_id);
                            global$.next({
                                action: 'GET_APILIST',
                                params: {
                                    page: 1,
                                    size: 100,
                                    team_id: localStorage.getItem('team_id'),
                                }
                            });
                        } else {
                            Message('error', '????????????!');
                        }
                    })
                )
                .subscribe();
        }
    }

    return (
        <>
            {modalType === 'description' && (
                <APIModal
                    value={data?.request?.description || ''}
                    onChange={onChange}
                    onCancel={setModalType.bind(null, '')}
                />
            )}
            <div className="api-manage">
                <div className="api-info-panel">
                    <div className="api-name-group">
                        {/* <ApiStatus
                            value={data?.mark}
                            onChange={(value) => {
                                onChange('mark', value);
                            }}
                        ></ApiStatus> */}
                        <Input
                            size="mini"
                            className="api-name"
                            placeholder={t('placeholder.apiName')}
                            value={data?.name || ''}
                            onChange={(value) => {
                                onChange('name', value);
                            }}
                        />
                    </div>
                    {/* <Button
                        className="api-explain"
                        size="mini"
                        onClick={setModalType.bind(null, 'description')}
                        afterFix={<SvgRight />}
                    >
                        ????????????
                    </Button> */}
                    {/* <ManageGroup target={data} showGenetateCode={showGenetateCode} /> */}
                </div>

                <div className='info-panel-right'>
                    <Button className='save-btn' onClick={() => saveApi()}
                    >{t('btn.save')}</Button>

                    <Dropdown
                        ref={refDropdown}
                        placement="bottom-end"
                        content={
                            <div className={DropWrapper}>
                                <div
                                    className="drop-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        saveApi();
                                        refDropdown.current.setPopupVisible(false);
                                    }}
                                >
                                    { t('apis.rootFolder') }
                                </div>
                                {apiFolders.map((item) => (
                                    <>
                                        <div
                                            className="drop-item"
                                            key={item.target_id}
                                            {...item}
                                            value={item.target_id}
                                            onClick={() => {
                                                saveApi(item.target_id);
                                                refDropdown.current.setPopupVisible(false);
                                            }}
                                        >
                                            {`|${new Array(item.level).fill('???').join('')}${item.name}`}
                                        </div>
                                    </>
                                ))}
                            </div>
                        }

                    >
                        <Button className='down-btn'>
                            <SvgDown width="12px" height="12px" />
                        </Button>
                    </Dropdown>
                </div>
            </div>
        </>
    );
};

export default ApiInfoPanel;
