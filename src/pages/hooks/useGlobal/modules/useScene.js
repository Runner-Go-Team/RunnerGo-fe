import { useEffect } from 'react';
import Bus, { useEventBus } from '@utils/eventBus';
import { cloneDeep, isArray, set } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { concatMap, map, tap, from } from 'rxjs';
import { fetchDeleteApi } from '@services/apis';
import { fetchCreateGroup, fetchCreateScene, fetchSceneDetail, fetchCreateSceneFlow, fetchSceneFlowDetail, fetchCreatePre } from '@services/scene';
import { formatSceneData, isURL, createUrl, GetUrlQueryToArray } from '@utils';
import { getBaseCollection } from '@constants/baseCollection';
import { fetchApiDetail } from '@services/apis';
import { v4 } from 'uuid';

import { global$ } from '../global';

const useScene = () => {
    const dispatch = useDispatch();
    // const nodes = useSelector((store) => store.scene.nodes);
    // const edges = useSelector((store) => store.scene.edges);
    const { id_apis, api_now, open_scene } = useSelector((store) => store.scene);
    // console.log(id_apis);
    const createApiNode = () => {
        const new_node = {
            id: `${nodes.length + 1}`,
            type: 'list',
            data: {
                showOne: nodes.length === 0 ? true : false,
            },
            position: { x: 50, y: 50 }
        };

        const _nodes = cloneDeep(nodes);

        _nodes.push(new_node);

        console.log(_nodes);

        dispatch({
            type: 'scene/updateNodes',
            payload: _nodes
        });
    };

    const updateSceneGroup = (req, callback) => {
        const { id, data, oldValue, from, plan_id } = req;
        console.log(req);

        const group = cloneDeep(oldValue);
        const params = {
            ...group,
            ...data
        };
        fetchCreateGroup(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    callback && callback();
                    // 刷新左侧目录列表
                    global$.next({
                        action: 'RELOAD_LOCAL_SCENE',
                    });
                }
            }
        })
    };

    const updateSceneItem = (req, callback) => {
        const { id, data, oldValue, from, plan_id } = req;
        console.log(req);

        const scene = cloneDeep(oldValue);
        const params = {
            ...scene,
            ...data
        };
        fetchCreateScene(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    callback && callback();
                    // 刷新左侧目录列表
                    global$.next({
                        action: 'RELOAD_LOCAL_SCENE',
                    });
                }
            }
        })
    };

    const dragUpdateScene = ({ ids, targetList }) => {
        const query = {
            team_id: sessionStorage.getItem('team_id'),
            target_id: ids
        };
        const targetDatas = {};
        targetList.forEach(item => {
            targetDatas[item.target_id] = item;
        })
        fetchSceneDetail(query).pipe(
            tap((res) => {
                const { code, data: { scenes } } = res;
                if (code === 0) {
                    scenes.forEach(item => {
                        let newItem = {
                            ...item,
                            parent_id: targetDatas[item.target_id].parent_id,
                            sort: targetDatas[item.target_id].sort
                        }
                        fetchCreateScene(newItem).subscribe();
                    });
                    setTimeout(() => {
                        global$.next({
                            action: 'RELOAD_LOCAL_SCENE',
                        });
                    }, 100);
                    // return targets;
                }
            }),

        )
            .subscribe();
    }

    const saveScene = (nodes, edges, id_apis, node_config, open_scene, callback) => {
        console.log('saveScene_nodes', nodes);
        const get_pre = (id, edges) => {
            const pre_list = [];
            edges.forEach(item => {
                if (item.target === id) {
                    pre_list.push(item.source);
                }
            })

            return pre_list;
        }

        const get_next = (id, edges) => {
            const next_list = [];
            edges.forEach(item => {
                if (item.source === id) {
                    next_list.push(item.target);
                }
            })

            return next_list;
        };

        const _nodes = nodes.map(item => {
            const api = id_apis[item.id];
            if (api) {
                return {
                    ...item,
                    api,
                    ...node_config[item.id],
                    pre_list: get_pre(item.id, edges),
                    next_list: get_next(item.id, edges),
                }
            } else {
                return {
                    ...item,
                    ...node_config[item.id],
                    pre_list: get_pre(item.id, edges),
                    next_list: get_next(item.id, edges),
                }
            }
        });
        console.log('saveScene__nodes', _nodes);
        console.log(open_scene);
        const params = {
            scene_id: parseInt(open_scene.target_id ? open_scene.target_id : open_scene.scene_id),
            team_id: parseInt(sessionStorage.getItem('team_id')),
            version: 1,
            nodes: _nodes,
            edges,
            source: 1,
            // multi_level_nodes: JSON.stringify(formatSceneData(nodes, edges))
            // songsong: formatSceneData(nodes, edges),
        };

        console.log(params);

        // callback && callback();

        // return;

        fetchCreateSceneFlow(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    callback && callback();
                }
            }
        })
    }

    const addNewSceneControl = (id, node_config = {}) => {
        console.log(998998, id, node_config);
        const new_nodes = cloneDeep(node_config);
        new_nodes[id] = {};

        console.log('addNewSceneControl', new_nodes);

        dispatch({
            type: 'scene/updateNodeConfig',
            payload: new_nodes,
        })
    }

    const addNewSceneApi = (id, id_apis = {}, node_config = {}, api = {}, config = {}) => {
        console.log(id, id_apis, node_config, api, config, '///////////////////////////');

        let _id = isArray(id) ? id : [id];
        let _api = isArray(api) ? api : [api];
        let _config = isArray(config) ? config : [config];
        let length = _config.length;
        let new_apis = cloneDeep(id_apis);
        let new_nodes = cloneDeep(node_config);

        for (let i = 0; i < _api.length; i++) {
            let newApi = cloneDeep(_api[i]);

            // console.log('newApi', api, newApi, Object.entries(_api[i]));

            if (Object.entries(_api[i]).length === 0) {
                newApi = getBaseCollection('api');
                newApi.method = 'POST';
                newApi.request.body.mode = 'none';
                newApi.is_changed = false;

                delete newApi['target_id'];
                delete newApi['parent_id'];
            } else {

            }

            new_apis[_id[i]] = newApi;

            console.log(new_apis);

            dispatch({
                type: 'scene/updateIdApis',
                payload: new_apis,
            })
        }

        for (let i = 0; i < _config.length; i++) {

            new_nodes[_id[i]] = _config[i];

            dispatch({
                type: 'scene/updateNodeConfig',
                payload: new_nodes,
            })

        }

        console.log(new_nodes, '/////////////////////////8858')
    }

    const updateNodeConfig = (type, value, id, node_config) => {
        console.log(type, value, id, node_config);
        const _node_config = cloneDeep(node_config);
        console.log(_node_config[id], 6666);
        _node_config[id][type] = value;
        // switch (type) {
        //     case 'weight':
        //         _node_config[id].weight = value;
        //         break;
        //     case 'error_threshold':
        //         _node_config[id].error_threshold = value;
        //         break;
        //     case 'response_threshold':
        //         _node_config[id].response_threshold = value;
        //         break;
        //     case 'request_threshold':
        //         _node_config[id].request_threshold = value;
        //         break;
        //     case 'percent_age':
        //         _node_config[id].percent_age = value;
        //         break;
        //     case 'wait_ms':
        //         _node_config[id].wait_ms = value;
        //         break;
        //     case 'var':
        //         _node_config[id].var = value;
        //         break;
        //     case 'compare':
        //         _node_config[id].compare = value;
        //         break;
        //     case 'val':
        //         _node_config[id].val = value;
        //         break;
        //     case 'remark':
        //         _node_config[id].remark = value;
        //         break;
        //     default:
        //         break;
        // }
        dispatch({
            type: 'scene/updateNodeConfig',
            payload: _node_config
        })
    }

    const updateSceneApi = (data, id_apis) => {
        const { id, pathExpression, value } = data;

        set(id_apis[id], pathExpression, value);

        console.log(pathExpression, value);

        console.log(data, id_apis);

        if (pathExpression === 'request.url') {
            let reqUrl = value;
            let queryList = [];
            const restfulList = [];
            if (reqUrl) {
                // 自动拼接url http://
                if (!isURL(reqUrl)) {
                    reqUrl = `http://${reqUrl}`;
                }
                const urlObj = createUrl(reqUrl);
                if (isArray(id_apis[id].request?.query?.parameter)) {
                    // 提取query
                    const searchParams = GetUrlQueryToArray(urlObj?.search || '');
                    queryList = id_apis[id].request.query.parameter.filter(
                        (item) => item?.is_checked < 0
                    );
                    searchParams.forEach((item) => {
                        const key = item?.key;
                        const value = item?.value;
                        let obj = {};
                        const i = findIndex(id_apis[id].request.query.parameter, { key });
                        if (i !== -1) obj = id_apis[id].request.query.parameter[i];
                        queryList.push({
                            description: obj?.description || '', // 字段描述
                            is_checked: obj?.is_checked || 1, // 是否启用
                            key: key?.trim(), // 参数名
                            type: obj?.type || 'Text', // 字段类型
                            not_null: obj?.not_null || 1, // 必填｜-1选填
                            field_type: obj?.field_type || 'String', // 类型
                            value: value?.trim(), // 参数值
                        });
                    });
                    set(id_apis[id], 'request.query.parameter', queryList);
                }

                if (isArray(id_apis[id].request?.resful?.parameter)) {
                    // 提取restful
                    const paths = urlObj.pathname.split('/');
                    paths.forEach((p) => {
                        if (p.substring(0, 1) === ':' && p.length > 1) {
                            let obj = {};
                            const i = findIndex(id_apis[id].request?.resful?.parameter, {
                                key: p.substring(1, p.length),
                            });
                            if (i !== -1) obj = id_apis[id].request?.resful?.parameter[i];
                            restfulList.push({
                                key: p.substring(1, p.length),
                                description: obj?.description || '',
                                is_checked: 1,
                                type: 'Text',
                                not_null: 1,
                                field_type: 'String',
                                value: obj?.value || '',
                            });
                        }
                    });
                    set(id_apis[id], 'request.resful.parameter', restfulList);
                }
            }
            set(id_apis[id], 'url', value);
        } else if (pathExpression === 'request.query.parameter') {
            let paramsStr = '';
            const url = id_apis[id].request?.url || '';
            if (
                isArray(id_apis[id].request?.query?.parameter) &&
                id_apis[id].request?.query?.parameter.length > 0
            ) {
                id_apis[id].request.query.parameter.forEach((ite) => {
                    if (ite.key !== '' && ite.is_checked == 1)
                        paramsStr += `${paramsStr === '' ? '' : '&'}${ite.key}=${ite.value}`;
                });
                const newUrl = `${url.split('?')[0]}${paramsStr !== '' ? '?' : ''}${paramsStr}`;
                set(id_apis[id], 'url', newUrl);
                set(id_apis[id], 'request.url', newUrl);
            }
        } else if (pathExpression === 'name') {
            set(id_apis[id], 'name', value);
        }

        set(id_apis[id], 'is_changed', true);
        console.log(id_apis);
        // dispatch({
        //     type: 'scene/updateIdApis',
        //     payload: id_apis,
        // });
        let _api_now = cloneDeep(id_apis[id]);
        _api_now.id = id;
        console.log(_api_now);
        dispatch({
            type: 'scene/updateApiNow',
            payload: _api_now
        });
    }

    const saveSceneApi = (api_now, id_apis, callback) => {
        const _id_apis = cloneDeep(id_apis);
        api_now.is_changed = false;
        const id = api_now.id;
        delete api_now['id'];
        _id_apis[id] = api_now;
        console.log(_id_apis);
        dispatch({
            type: 'scene/updateIdApis',
            payload: _id_apis,
        });

        callback && callback();
    }

    const importApiList = (ids) => {
        const query = {
            team_id: sessionStorage.getItem('team_id'),
            target_ids: ids,
        };
        fetchApiDetail(query).subscribe({
            next: (res) => {
                const { code, data: { targets } } = res;
                // 1. 添加nodes节点
                // 2. 添加id_apis映射
                dispatch({
                    type: 'scene/updateImportNode',
                    payload: targets,
                })
            }
        })
    }

    const addOpenScene = (id, id_apis, node_config) => {
        console.log('addOpenScene', id);
        const { target_id } = id;
        const query = {
            team_id: sessionStorage.getItem('team_id'),
            scene_id: target_id,
        };
        fetchSceneFlowDetail(query).subscribe({
            next: (res) => {
                const { data } = res;
                console.log('获取场景流程详情', data);
                if (data && data.nodes.length > 0) {
                    const { nodes } = data;
                    const idList = [];
                    const apiList = [];
                    const configList = [];
                    nodes.forEach(item => {
                        const {
                            id,
                            // api配置
                            api,
                            // node其他配置
                            // api
                            weight,
                            mode,
                            error_threshold,
                            response_threshold,
                            request_threshold,
                            percent_age,
                            // 等待控制器
                            wait_ms,
                            // 条件控制器
                            var: _var,
                            compare,
                            val,
                            remark,
                        } = item;
                        const config = {
                            weight,
                            mode,
                            error_threshold,
                            response_threshold,
                            request_threshold,
                            percent_age,
                            wait_ms,
                            var: _var,
                            compare,
                            val,
                            remark
                        };
                        api && apiList.push(api);
                        configList.push(config);
                        idList.push(id);

                    });
                    Bus.$emit('addNewSceneApi', idList, id_apis, node_config, apiList, configList);
                }

                dispatch({
                    type: 'scene/updateOpenScene',
                    payload: data || { target_id, },
                })
            }
        })
    }

    const deleteScene = (id, callback) => {
        const params = {
            target_id: parseInt(id),
        };
        fetchDeleteApi(params).subscribe({
            next: (res) => {
                global$.next({
                    action: 'RELOAD_LOCAL_SCENE',
                });
                callback && callback(res.code);
            }
        })
    }

    const cloneScene = (id) => {
        const query = {
            team_id: sessionStorage.getItem('team_id'),
            target_id: id,
        }
        fetchSceneDetail(query).pipe(
            map((d) => d),
            tap((res) => {
                console.log(res);
                const { data: { scenes } } = res;
                const new_scene = scenes[0];
                const clone_id = new_scene.target_id;
                delete new_scene.target_id;
                new_scene.name = `${new_scene.name} 副本`;
                Bus.$emit('addSceneItem', {
                    type: 'scene',
                    pid: 0,
                    param: new_scene,
                    from: 'scene',
                    clone: true,
                    clone_id,
                })
                // return from(fetchCreateScene(new_scene));
            }),
            // tap((res) => {
            //     console.log(res);
            // })
        ).subscribe();
    }

    const cloneSceneFlow = (id, clone_id) => {
        const query = {
            team_id: sessionStorage.getItem('team_id'),
            scene_id: clone_id,
        };

        fetchSceneFlowDetail(query).pipe(
            concatMap((res) => {
                console.log(res);
                const { data } = res;

                const clone_flow = cloneDeep(data);
                delete clone_flow['scene_id'];
                clone_flow.scene_id = parseInt(id);

                return from(fetchCreateSceneFlow(clone_flow))
            }),
            tap(res => {
                console.log(res);
            })
        ).subscribe();
    };

    const cloneNode = (id, nodes, node_config, id_apis, open_scene) => {
        // API
        // 1. nodes 2. api
        console.log(1, id, 2, nodes, 3, node_config, 4, id_apis);

        const _clone_api = id_apis[id];
        const _clone_config = node_config[id];

        const from_node = nodes.filter(item => item.id === id)[0];
        const _from_node = cloneDeep(from_node);

        const _id = v4();

        _from_node.id = _id;
        _from_node.data.id = _id;
        _from_node.position = {
            x: from_node.position.x + 100,
            y: from_node.position.y + 100,
        };

        console.log('_from_node', _from_node);

        id_apis[_id] = _clone_api;
        node_config[_id] = _clone_config;
        nodes.push(_from_node);

        console.log('id_apis', id_apis);
        console.log('node_config', node_config);
        console.log('nodes', nodes);


        dispatch({
            type: 'scene/updateIdApis',
            payload: id_apis,
        });

        dispatch({
            type: 'scene/updateNodeConfig',
            payload: node_config,
        })

        dispatch({
            type: 'scene/updateNodes',
            payload: nodes,
        })

        dispatch({
            type: 'scene/updateCloneNode',
            payload: _from_node,
        })
    }

    useEventBus('createApiNode', createApiNode);
    useEventBus('updateSceneGroup', updateSceneGroup);
    useEventBus('updateSceneItem', updateSceneItem);
    useEventBus('dragUpdateScene', dragUpdateScene);
    useEventBus('saveScene', saveScene);
    useEventBus('addNewSceneApi', addNewSceneApi);
    useEventBus('updateSceneApi', updateSceneApi);
    useEventBus('saveSceneApi', saveSceneApi);
    useEventBus('updateNodeConfig', updateNodeConfig);
    useEventBus('addNewSceneControl', addNewSceneControl);
    useEventBus('importApiList', importApiList);
    useEventBus('addOpenScene', addOpenScene);
    useEventBus('deleteScene', deleteScene);
    useEventBus('cloneScene', cloneScene);
    useEventBus('cloneSceneFlow', cloneSceneFlow);
    useEventBus('cloneNode', cloneNode);
};

export default useScene;