import { useEffect } from 'react';
import Bus, { useEventBus } from '@utils/eventBus';
import { cloneDeep, isArray, set, findIndex } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { concatMap, map, tap, from } from 'rxjs';
import { fetchDeleteApi, fetchChangeSort } from '@services/apis';
import { fetchCreateGroup, fetchCreateScene, fetchSceneDetail, fetchCreateSceneFlow, fetchSceneFlowDetail, fetchCreatePre, fetchRunScene, fetchGetSceneRes, fetchSendSceneApi, fetchStopScene, fetchDeleteScene } from '@services/scene';
import { fetchGetTask, fetchSavePlan } from '@services/plan';
import { formatSceneData, isURL, createUrl, GetUrlQueryToArray } from '@utils';
import { getBaseCollection } from '@constants/baseCollection';
import { fetchApiDetail, fetchGetResult } from '@services/apis';
import { v4 } from 'uuid';
import QueryString from 'qs';

import { global$ } from '../global';

let scene_t = null;
let send_scene_api_t = null;

const useScene = () => {
    const dispatch = useDispatch();
    // const nodes = useSelector((store) => store.scene.nodes);
    // const edges = useSelector((store) => store.scene.edges);
    const { open_apis, open_api_now, open_res } = useSelector((store) => store?.opens)
    const { id_apis, node_config, api_now, open_scene, open_scene_name, sceneDatas, run_api_res, nodes, edges } = useSelector((store) => store.scene);
    // const scene = useScene((store) => store.scene);
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

        dispatch({
            type: 'scene/updateNodes',
            payload: _nodes
        });
    };

    const updateSceneGroup = (req, callback) => {
        const { id, data, oldValue, from, plan_id } = req;

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
                    // ????????????????????????
                    global$.next({
                        action: 'RELOAD_LOCAL_SCENE',
                    });
                }
            }
        })
    };

    const updateSceneItem = (req, callback) => {
        const { id, data, oldValue, from, plan_id } = req;

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
                    // ????????????????????????
                    global$.next({
                        action: 'RELOAD_LOCAL_SCENE',
                    });
                }
            }
        })
    };

    const dragUpdateScene = ({ ids, targetList }) => {

        const _ids = cloneDeep(ids);
        _ids.forEach(item => {
            if (typeof item.parent_id === 'string') {
                item.parent_id = parseInt(item.parent_id);
            }
        })

        const query = {
            team_id: localStorage.getItem('team_id'),
            target_id: _ids,
            // source: 1,
        };
        const targetDatas = {};
        targetList.forEach(item => {
            targetDatas[item.target_id] = item;
            if (typeof item.parent_id === 'string') {
                item.parent_id = parseInt(item.parent_id);
            }
        })
        const params = {
            // parent_id: parseInt(parent_id),
            // sort: parseInt(sort),
            // target_id: parseInt(target_id),
            targets: targetList,
            // team_id: parseInt(localStorage.getItem('team_id')),
        };
        fetchChangeSort(params).subscribe({
            next: (res) => {
                global$.next({
                    action: 'RELOAD_LOCAL_SCENE',
                });
            }
        });
        return;
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

    const saveScene = (callback) => {
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

        const _nodes = nodes && nodes.map(item => {
            const api = id_apis[item.id];
            if (api) {
                return {
                    ...item,
                    api,
                    weight: 100,
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
        const params = {
            scene_id: parseInt(open_scene.target_id ? open_scene.target_id : open_scene.scene_id),
            team_id: parseInt(localStorage.getItem('team_id')),
            version: 1,
            nodes: _nodes,
            edges,
            source: 1,
            // multi_level_nodes: JSON.stringify(formatSceneData(nodes, edges))
            // songsong: formatSceneData(nodes, edges),
        };
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
        const new_nodes = cloneDeep(node_config);
        new_nodes[id] = {};

        dispatch({
            type: 'scene/updateNodeConfig',
            payload: new_nodes,
        })
    }

    const addNewSceneApi = (id, id_apis = {}, node_config = {}, api = {}, config = {}, from) => {
        let _id = isArray(id) ? id : [id];
        let _api = isArray(api) ? api : [api];
        let _config = isArray(config) ? config : [config];
        let length = _config.length;
        let new_apis = cloneDeep(id_apis);
        let new_nodes = cloneDeep(node_config);

        for (let i = 0; i < _api.length; i++) {
            let newApi = cloneDeep(_api[i]);

            if (Object.entries(_api[i]).length < 2) {
                newApi = getBaseCollection('api');
                newApi.method = 'POST';
                newApi.request.body.mode = 'none';
                newApi.is_changed = false;
                newApi.id = _api[i].id;

                delete newApi['target_id'];
                delete newApi['parent_id'];
            } else {

            }

            new_apis[newApi.id] = newApi;
            if (from === 'scene') {
                dispatch({
                    type: 'scene/updateIdApis',
                    payload: new_apis,
                })
            } else {
                dispatch({
                    type: 'plan/updateIdApis',
                    payload: new_apis,
                })
            }
        }

        for (let i = 0; i < _config.length; i++) {

            new_nodes[_id[i]] = _config[i];

            if (from === 'scene') {
                dispatch({
                    type: 'scene/updateNodeConfig',
                    payload: new_nodes,
                })
            } else {
                dispatch({
                    type: 'plan/updateNodeConfig',
                    payload: new_nodes,
                })
            }
        }
    }

    const updateNodeConfig = (type, value, id, node_config, from) => {
        console.log(type, value, id, node_config, from);
        const _node_config = cloneDeep(node_config);
        _node_config[id][type] = value;
        if (type === 'mode' && value === 4) {
            _node_config[id]['percent_age'] = 90;
        }
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

        console.log(_node_config);
        if (from === 'scene') {
            dispatch({
                type: 'scene/updateNodeConfig',
                payload: _node_config
            })
        } else {
            dispatch({
                type: 'plan/updateNodeConfig',
                payload: _node_config
            })
        }
    }

    const updateSceneApi = (data, id_apis) => {
        const { id, pathExpression, value } = data;

        set(id_apis[id], pathExpression, value);

        if (pathExpression === 'request.url') {
            let reqUrl = value;
            let queryList = [];
            const restfulList = [];
            if (reqUrl) {
                // ????????????url http://
                if (!isURL(reqUrl)) {
                    reqUrl = `http://${reqUrl}`;
                }
                const urlObj = createUrl(reqUrl);
                if (isArray(id_apis[id].request?.query?.parameter)) {
                    // ??????query
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
                            description: obj?.description || '', // ????????????
                            is_checked: obj?.is_checked || 1, // ????????????
                            key: key?.trim(), // ?????????
                            type: obj?.type || 'Text', // ????????????
                            not_null: obj?.not_null || 1, // ?????????-1??????
                            field_type: obj?.field_type || 'String', // ??????
                            value: value?.trim(), // ?????????
                        });
                    });
                    set(id_apis[id], 'request.query.parameter', queryList);
                }

                if (isArray(id_apis[id].request?.resful?.parameter)) {
                    // ??????restful
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
            // set(id_apis[id], 'request.url', reqUrl);
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
        // dispatch({
        //     type: 'scene/updateIdApis',
        //     payload: id_apis,
        // });
        let _api_now = cloneDeep(id_apis[id]);
        _api_now.id = id;

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

        dispatch({
            type: 'scene/updateIdApis',
            payload: _id_apis,
        });

        callback && callback();
    }

    const importApiList = (ids) => {
        const query = {
            team_id: localStorage.getItem('team_id'),
            target_ids: ids,
        };
        fetchApiDetail(QueryString.stringify(query, { indices: false })).subscribe({
            next: (res) => {
                const { code, data: { targets } } = res;
                // 1. ??????nodes??????
                // 2. ??????id_apis??????
                dispatch({
                    type: 'scene/updateImportNode',
                    payload: targets,
                })
            }
        })
    }

    const addOpenScene = (id) => {
        // dispatch({
        //     type: 'scene/updateOpenScene',
        //     payload: null,
        // })
        dispatch({
            type: 'scene/updateRunRes',
            payload: null,
        })
        dispatch({
            type: 'scene/updateRunningScene',
            payload: '',
        })
        dispatch({
            type: 'scene/updateNodes',
            payload: [],
        });
        dispatch({
            type: 'scene/updateEdges',
            payload: [],
        })
        dispatch({
            type: 'scene/updateCloneNode',
            payload: [],
        })
        dispatch({
            type: 'scene/updateSuccessEdge',
            payload: [],
        });
        dispatch({
            type: 'scene/updateFailedEdge',
            payload: [],
        });
        dispatch({
            type: 'scene/updateApiConfig',
            payload: false,
        })
        dispatch({
            type: 'scene/updateBeautify',
            payload: false
        }) 
        let _id = '';
        if (typeof id === 'object') {
            const { target_id, scene_id } = id;
            _id = target_id ? target_id : scene_id;
        } else {
            _id = id;
        }
        const { target_id, scene_id } = id;
        const query = {
            team_id: localStorage.getItem('team_id'),
            scene_id: _id
        };
        fetchSceneFlowDetail(query).subscribe({
            next: (res) => {
                const { data } = res;
                if (data && data.nodes && data.nodes.length > 0) {
                    const { nodes } = data;
                    const idList = [];
                    const apiList = [];
                    const configList = [];
                    nodes.forEach(item => {
                        const {
                            id,
                            // api??????
                            api,
                            // node????????????
                            // api
                            weight,
                            mode,
                            error_threshold,
                            response_threshold,
                            request_threshold,
                            percent_age,
                            // ???????????????
                            wait_ms,
                            // ???????????????
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
                        if (api) {
                            api.id = id;
                            apiList.push(api);
                        }
                        // api && apiList.push(api);
                        configList.push(config);
                        idList.push(id);

                    });
                    Bus.$emit('addNewSceneApi', idList, id_apis, node_config, apiList, configList, 'scene');
                }

                dispatch({
                    type: 'scene/updateOpenScene',
                    payload: data || { target_id, },
                })
            }
        })
    }

    const deleteScene = (id, open_scene, from, callback) => {
    
        const params = {
            target_id: parseInt(id),
        };
        fetchDeleteScene(params).subscribe({
            next: (res) => {
                if (res.code === 0 || parseInt(open_scene || open_scene.scene_id || open_scene.target_id) === parseInt(id)) {
                    if (from === 'scene') {
                        dispatch({
                            type: 'scene/updateOpenScene',
                            payload: null,
                        })
                    } else {
                        dispatch({
                            type: 'plan/updateOpenScene',
                            payload: null,
                        })
                    }
                }
                global$.next({
                    action: 'RELOAD_LOCAL_SCENE',
                });
                callback && callback(res.code);

                localStorage.removeItem('open_scene');
            }
        })
    }
    const cloneScene = (id, from, plan_id) => {
        const query = {
            team_id: localStorage.getItem('team_id'),
            target_id: id,
        }
        fetchSceneDetail(query).pipe(
            map((d) => d),
            tap((res) => {
                const { data: { scenes } } = res;
                const new_scene = scenes[0];
                const clone_id = new_scene.target_id;
                delete new_scene.target_id;
                new_scene.name = `${new_scene.name} copy`;
                Bus.$emit('addSceneItem', {
                    type: 'scene',
                    pid: 0,
                    param: new_scene,
                    from,
                    clone: true,
                    clone_id,
                    plan_id
                })
                // return from(fetchCreateScene(new_scene));
            }),
            // tap((res) => {
            // })
        ).subscribe();
    }

    const cloneSceneFlow = (id, clone_id) => {
        const query = {
            team_id: localStorage.getItem('team_id'),
            scene_id: clone_id,
        };

        fetchSceneFlowDetail(query).pipe(
            concatMap((res) => {
                const { data } = res;

                const clone_flow = cloneDeep(data);
                delete clone_flow['scene_id'];
                clone_flow.scene_id = parseInt(id);
                clone_flow.nodes.forEach(item => {
                    const _id = item.id;
                    const id = v4();
                    item.id = id;
                    item.data.id = id;

                    clone_flow.edges.forEach(item => {
                        if (item.target === _id) {
                            item.target = id;
                        }
                        if (item.source === _id) {
                            item.source = id;
                        }
                    })
                })

                console.log(clone_flow);

                return from(fetchCreateSceneFlow(clone_flow))
            }),
            tap(res => {
            })
        ).subscribe();
    };

    const cloneSceneTask = (newId, oldId, plan_id) => {
        const query = {
            team_id: localStorage.getItem('team_id'),
            plan_id,
            scene_id: oldId
        };

        fetchGetTask(query).subscribe({
            next: (res) => {
                let { data: { plan_task } } = res;

                plan_task.scene_id = newId;
                plan_task.name = 'alskjdklajsd';
                plan_task.remark = 'asdlkjaskldjasd';
                plan_task.team_id = parseInt(localStorage.getItem('team_id'))
                
                fetchSavePlan(plan_task).subscribe();
                
            }
        })
    }

    const getNewCoordinate = (nodes) => {
        let position = {
            x: 50,
            y: 50,
        };
        nodes.forEach(item => {
            if (item.position.x >= position.x - 10 || item.position.x <= position.x + 10) {
                position.x +=  40;
            }
            if (item.position.y >= position.y - 10 || item.position.y <= position.y + 10) {
                position.y += 40;
            }
        });
        return position;
    }

    const cloneNode = (id, nodes, node_config, id_apis, open_scene, from) => {
        // API
        // 1. nodes 2. api

        const _clone_api = cloneDeep(id_apis[id]);


        const from_node = nodes.filter(item => item.id === id)[0];
        const _from_node = cloneDeep(from_node);

        const _id = v4();
        const _clone_config = {
            ...node_config[id],
            id: _id
        };

        _from_node.id = _id;
        _from_node.data.id = _id;
        _from_node.data.from = from_node.data.from;
        _from_node.position = getNewCoordinate(nodes);
        _from_node.dragging = false;
        _from_node.selected = false;
        _from_node.dragHandle = '.drag-content';

        _clone_api.id = _id;


        id_apis[_id] = _clone_api;

        node_config[_id] = _clone_config;
        nodes.push(_from_node);

        // const _open_scene = cloneDeep(open_scene);
        // _open_scene.nodes = [..._open_scene.nodes, _from_node];
        // console.log(_open_scene, _from_node);


        if (from === 'scene') {
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
            // dispatch({
            //     type: 'scene/updateOpenScene',
            //     payload: _open_scene,
            // })
        } else {
            dispatch({
                type: 'plan/updateIdApis',
                payload: id_apis,
            });

            dispatch({
                type: 'plan/updateNodeConfig',
                payload: node_config,
            })

            dispatch({
                type: 'plan/updateNodes',
                payload: nodes,
            })

            dispatch({
                type: 'plan/updateCloneNode',
                payload: _from_node,
            })
            // dispatch({
            //     type: 'plan/updateOpenScene',
            //     payload: _open_scene,
            // })
        }
    };

    const runScene = (scene_id, length, from) => {
        const params = {
            team_id: parseInt(localStorage.getItem('team_id')),
            scene_id: parseInt(scene_id),
        };

        fetchRunScene(params).subscribe({
            next: (res) => {
                const { data: { ret_id } } = res;

                const query = {
                    ret_id,
                };
                let getCount = 0;

                scene_t = setInterval(() => {
                    // if (getCount === 120) {
                    //     clearInterval(scene_t);
                    // }

                    fetchGetSceneRes(query).subscribe({
                        next: (res) => {
                            const { data } = res;

                            if (data.scenes) {
                                const { scenes } = data;
                                console.log(scenes);

                                if (from === 'scene') {
                                    dispatch({
                                        type: 'scene/updateRunRes',
                                        payload: scenes,
                                    })
                                } else {
                                    dispatch({
                                        type: 'plan/updateRunRes',
                                        payload: scenes,
                                    })
                                }

                                
                                if (data.scenes.length === length) {
                                    clearInterval(scene_t);
                                    if (from === 'scene') {
                                        dispatch({
                                            type: 'scene/updateRunStatus',
                                            payload: 'finish',
                                        })
                                    } else {
                                        dispatch({
                                            type: 'plan/updateRunStatus',
                                            payload: 'finish',
                                        })
                                    }
                                    // const { scenes } = data;

                                    // dispatch({
                                    //     type: 'scene/updateRunRes',
                                    //     payload: scenes,
                                    // })
                                }
                                getCount++;
                            }
                        }
                    })
                }, 300);
            }
        })
    };

    const sendSceneApi = (scene_id, node_id, run_api_res, from) => {
        const params = {
            scene_id: parseInt(scene_id),
            node_id,
            team_id: parseInt(localStorage.getItem('team_id')),
        };
        const _run_api_res = cloneDeep(run_api_res);
        _run_api_res[node_id] = {
            ..._run_api_res[node_id],
            status: 'running',
        };
        if (from === 'scene') {
            dispatch({
                type: 'scene/updateApiRes',
                payload: _run_api_res
            })
        } else {
            dispatch({
                type: 'plan/updateApiRes',
                payload: _run_api_res
            })
        }
        fetchSendSceneApi(params).pipe(
            tap(res => {
                const { data: { ret_id } } = res;
                const query = {
                    ret_id,
                };
                send_scene_api_t = setInterval(() => {
                    fetchGetResult(query).subscribe({
                        next: (res) => {
                            const { data } = res;
                            if (data) {
                                clearInterval(send_scene_api_t);
                                const _run_api_res = cloneDeep(run_api_res);
                                _run_api_res[node_id] = {
                                    ...data,
                                    status: 'finish',
                                };
                                if (from === 'scene') {
                                    dispatch({
                                        type: 'scene/updateApiRes',
                                        payload: _run_api_res
                                    })
                                } else if (from === 'plan') {
                                    dispatch({
                                        type: 'plan/updateApiRes',
                                        payload: _run_api_res
                                    })
                                }
                            }
                        }
                    })
                }, 1000);
            })
        )
            .subscribe()
    };

    const toDeleteGroup = (target_id, callback) => {

        fetchDeleteScene({ target_id: parseInt(target_id) }).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    callback && callback();
                }
            }
        });

        // const deleteIds = [target_id];
        // const _sceneDatas = cloneDeep(sceneDatas);

        // const loopGetChild = (parent_id, _sceneDatas) => {
        //     let arr = [];
        //     let resArr = [];
        //     for (let i in _sceneDatas) {

        //         if (`${_sceneDatas[i].parent_id}` === `${parent_id}`) {
        //             arr.push(_sceneDatas[i].target_id);
        //             if (_sceneDatas[i].target_type === 'folder') {
        //                 resArr = loopGetChild(_sceneDatas[i].target_id, _sceneDatas);
        //             }
        //         }
        //     }
        //     return arr.concat(resArr);
        // };

        // const _res = deleteIds.concat(loopGetChild(target_id, _sceneDatas))
        
        // _res.forEach(item => {
        //     fetchDeleteApi({ target_id: parseInt(item) }).subscribe(); 
        // })

        // callback && callback();
    };

    const stopScene = (scene_id, from, callback) => {
        const params = {
            scene_id: parseInt(scene_id),
            team_id: parseInt(localStorage.getItem('team_id'))
        };
        fetchStopScene(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    clearInterval(scene_t);
                    callback && callback();
                    if (from === 'scene') {
                        dispatch({
                            type: 'scene/updateRunStatus',
                            payload: 'finish',
                        })
                    } else {
                        dispatch({
                            type: 'plan/updateRunStatus',
                            payload: 'finish',
                        })
                    }
                }
            }
        })
    };

    const stopSceneApi = (id) => {
        clearInterval(send_scene_api_t);
        const _run_api_res = cloneDeep(run_api_res);
        _run_api_res[id] = {
            status: 'finish',
        };
        dispatch({
            type: 'scene/updateApiRes',
            payload: _run_api_res
        })
    };

    const openRecordScene = (sceneDatas) => {
        const open_scene = localStorage.getItem('open_scene');
        if (typeof open_scene === 'object' && Object.entries(open_scene || {}).length > 0) {
            const { scene_id, name } = open_scene;
            dispatch({
                type: 'scene/updateOpenName',
                payload: name,
            })
            addOpenScene({ target_id: scene_id });
        }
    };

    const recordOpenScene = () => {
        if (Object.entries(open_scene).length > 0) {
            const scene = {
                scene_id: open_scene.scene_id ? open_scene.scene_id : open_scene.target_id,
                name: open_scene_name,
            }
            localStorage.setItem('open_scene', JSON.stringify(scene));
        }
    }

    useEventBus('createApiNode', createApiNode);
    useEventBus('updateSceneGroup', updateSceneGroup);
    useEventBus('updateSceneItem', updateSceneItem);
    useEventBus('dragUpdateScene', dragUpdateScene);
    useEventBus('saveScene', saveScene, [nodes, edges, id_apis, node_config, open_scene]);
    useEventBus('addNewSceneApi', addNewSceneApi);
    useEventBus('updateSceneApi', updateSceneApi);
    useEventBus('saveSceneApi', saveSceneApi);
    useEventBus('updateNodeConfig', updateNodeConfig);
    useEventBus('addNewSceneControl', addNewSceneControl);
    useEventBus('importApiList', importApiList);
    useEventBus('addOpenScene', addOpenScene, [id_apis, node_config]);
    useEventBus('deleteScene', deleteScene, [sceneDatas]);
    useEventBus('cloneScene', cloneScene);
    useEventBus('cloneSceneFlow', cloneSceneFlow);
    useEventBus('cloneNode', cloneNode);
    useEventBus('runScene', runScene, [open_scene]);
    useEventBus('sendSceneApi', sendSceneApi);
    useEventBus('toDeleteGroup', toDeleteGroup, [sceneDatas]);
    useEventBus('stopScene', stopScene);
    useEventBus('stopSceneApi', stopSceneApi, [run_api_res]);
    useEventBus('openRecordScene', openRecordScene, [sceneDatas]);
    useEventBus('recordOpenScene', recordOpenScene, [open_scene, open_scene_name]);
    useEventBus('cloneSceneTask', cloneSceneTask);
};

export default useScene;