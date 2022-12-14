import React, { useRef, useState, useEffect } from 'react';
import { Input, Select, Button, Dropdown } from 'adesign-react';
import { Down } from 'adesign-react/icons';
import { API_METHODS } from '@constants/methods';
import isFunction from 'lodash/isFunction';
import useApi from '../../../hooks/useApi';
import UrlInput from './urlInput';
import { useSelector, useDispatch } from 'react-redux';
import Bus from '@utils/eventBus';
import { useParams } from 'react-router-dom';
import './index.less';
import { cloneDeep, debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

const Option = Select.Option;
const ApiURLPanel = (props) => {
    const { data, onChange, tempData, from = 'apis' } = props;
    const { t } = useTranslation();
    const { apiSend } = useApi();
    const { id } = useParams();
    const [btnName, setBtnName] = useState(t('btn.send'));
    const dispatch = useDispatch();
    const open_api_now = useSelector((store) => store.opens.open_api_now);
    const opens = useSelector((store) => store.opens.open_apis);

    const open_res = useSelector((store) => store.opens.open_res);

    const open_scene_res = useSelector((store) => store.scene.run_api_res)
    const open_scene = useSelector((store) => store.scene.open_scene);

    const open_plan_res = useSelector((store) => store.plan.run_api_res);
    const open_plan_scene = useSelector((store) => store.plan.open_plan_scene);

    const id_now = useSelector((store) => store.scene.id_now);
    const id_now_plan = useSelector((store) => store.plan.id_now);

    const _saveId = useSelector((store) => store.opens.saveId);

    const language = useSelector((store) => store.user.language);

    useEffect(() => {
        setBtnName(t('btn.send'));
    }, language);


    const res_list = {
        'apis': open_res && open_res[open_api_now],
        'scene': open_scene_res && open_scene_res[id_now],
        'plan': open_plan_res && open_plan_res[id_now_plan],
    };

    const res_now = res_list[from];

    useEffect(() => {
        console.log(open_res);
        if (res_now && res_now.status === 'finish') {
            setBtnName(t('btn.send'));
        }
    }, [res_now]);

    useEffect(() => {
        setSaveId(_saveId);
        // if (_saveId) {
            // setSaveId(_saveId);
        // }
    }, [_saveId]);

    const {
        nodes: nodes_scene,
        edges: edges_scene,
        id_apis: id_apis_scene,
        node_config: node_config_scene,
        open_scene: open_scene_scene,
    } = useSelector((store) => store.scene);
    const {
        nodes: nodes_plan,
        edges: edges_plan,
        id_apis: id_apis_plan,
        node_config: node_config_plan,
        open_plan_scene: open_scene_plan,
    } = useSelector((store) => store.plan);
    const nodes = from === 'scene' ? nodes_scene : nodes_plan;
    const edges = from === 'scene' ? edges_scene : edges_plan;
    const id_apis = from === 'scene' ? id_apis_scene : id_apis_plan;
    const node_config = from === 'scene' ? node_config_scene : node_config_plan;
    // const open_scene = from === 'scene' ? open_scene_scene : open_scene_plan;

    // if (from === 'apis') {
    //     if (open_res || open_res[open_api_now] || open_res[open_api_now].status === 'running') {
    //         setBtnName('?????????...');
    //     } else {
    //         setBtnName('??????');
    //     }
    // } else if (from === 'scene') {
    //     if (open_scene_res || open_scene_res[id_now] || open_scene_res[id_now].status === 'running') {
    //         setBtnName('?????????...');
    //     } else {
    //         setBtnName('??????');
    //     }
    // } else if (from === 'plan') {
    //     if (open_plan_res && open_plan_res[id_now_plan] && open_plan_res[id_now_plan].status === 'running') {
    //         setBtnName('?????????...');
    //     } else {
    //         setBtnName('??????');
    //     }
    // }
    const refDropdown = useRef(null);
    const [saveId, setSaveId] = useState(null);

    console.log(open_scene_scene);

    return (
        <div className="api-url-panel" style={{ marginLeft: from === 'apis' ? '16px' : '' }}>
            <div className="api-url-panel-group">
                <Select
                    className="api-status"
                    size="middle"
                    value={data?.method || 'GET'}
                    onChange={(value) => {
                        onChange('method', value);
                    }}
                >
                    {API_METHODS.map((item) => (
                        <Option key={item} value={item}>
                            {item}
                        </Option>
                    ))}
                </Select>
                {/* <MetionInput /> */}
                <UrlInput
                    placeholder={ t('placeholder.apiUrl') }
                    onChange={(value) => onChange('url', value)}
                    value={data?.url || ''}
                />
            </div>
            <div style={{ marginLeft: 8 }} className="btn-send">
                <Button
                    type="primary"
                    size="middle"
                    style={{ marginRight: from === 'apis' ? '16px' : '' }}
                    disabled={btnName === t('btn.sending')}
                    onClick={() => {
                        // apiSend(data);
                        setBtnName(t('btn.sending'));
                        if (from === 'scene') {
                            Bus.$emit('saveScene', () => {
                                Bus.$emit('sendSceneApi', open_scene_scene.scene_id || open_scene_scene.target_id, id_now, open_scene_res || {}, 'scene');
                            });
                        } else if (from === 'plan') {
                            Bus.$emit('saveScenePlan', nodes, edges, id_apis, node_config, open_plan_scene, id, () => {
                                Bus.$emit('sendSceneApi', open_plan_scene.scene_id || open_plan_scene.target_id, id_now_plan, open_plan_res || {}, 'plan');
                            });
                        } else {
                            Bus.$emit('saveTargetById', {
                                id: open_api_now,
                                saveId: saveId,
                            }, {}, (code, id) => {
                                setSaveId(id);
                                Bus.$emit('sendApi', id);
                            })
                        }
                    }}
                // disabled={
                //     from === 'scene' ? open_scene_res && open_scene_res[id_now]?.status === 'running' : open_res && open_res[open_api_now]?.status === 'running'
                // }
                >
                    {btnName}
                    {/* ?????? */}
                </Button>
                {/* <Dropdown
                    ref={refDropdown}
                    placement="bottom-end"
                    className="request-download-btn"
                    content={<></>}
                >
                    <div className="right">
                        <div className="split-line" />
                        <Down width={16} className="arrow-icon" />
                    </div>
                </Dropdown> */}
            </div>
        </div>
    );
};

export default ApiURLPanel;
