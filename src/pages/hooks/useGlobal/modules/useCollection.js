import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { filter, switchMap, map, concatMap } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { getApiList$ } from '@rxUtils/collection';
import { getSceneList$ } from '@rxUtils/scene';
import { getLocalTargets } from '@busLogics/projects';
// import { Collection } from '@indexedDB/project';
// import { User } from '@indexedDB/user';
import { v4 as uuidv4 } from 'uuid';
import isObject from 'lodash/isObject';
import Bus, { useEventBus } from '@utils/eventBus';
import { getBaseCollection } from '@constants/baseCollection';
import { SaveTargetRequest, addMultiTargetRequest, fetchHandleFolder } from '@services/apis';
import { fetchCreateGroup, fetchCreateScene } from '@services/scene';
import { cloneDeep, isArray, isPlainObject, isString, isUndefined, max } from 'lodash';
import { pushTask } from '@asyncTasks/index';
import dayjs from 'dayjs';
import { global$ } from '../global';

const useCollection = () => {
    const dispatch = useDispatch();
    const { CURRENT_PROJECT_ID } = useSelector((store) => store?.workspace);
    const updateCollectionById = async (payload) => {
        const { id, data } = payload;
        let target = await Collection.get(id);
        if (target && isObject(target)) {
            target = { ...target, ...data };
            await Collection.put(target, target.target_id);
        }
    };
    // 重新排序
    const targetReorder = async (target) => {
        if (isObject(target) && target.hasOwnProperty('parent_id')) {
            const parentKey = target.parent_id || '0';
            const project_id = target?.project_id;
            const projectNodes = await Collection.where('project_id').anyOf(project_id).toArray();
            let sort = 0;
            const rootNodes = projectNodes.filter((item) => item.parent_id === parentKey);
            const nodeSort = rootNodes.map((item) => item.sort);
            sort = max(nodeSort) || 0;
            target.sort = sort + 1;
        }
        return target;
    };

    // 过滤key为空的值
    const filterEmptyKey = async (target) => {
        const { target_type } = target;
        if (target_type === 'api' || target_type === 'websocket') {
            if (target?.request) {
                if (isArray(target?.request?.header?.parameter)) {
                    target.request.header.parameter = target.request.header.parameter.filter(
                        (ite) => ite.key !== ''
                    );
                }
                if (isArray(target?.request?.body?.parameter)) {
                    target.request.body.parameter = target.request.body.parameter?.filter(
                        (ite) => ite.key !== ''
                    );
                    target.request.body.parameter?.forEach((ite) => {
                        // 过滤文件对象
                        if (ite.type === 'File' && ite.key !== '' && typeof ite?.value !== 'string') {
                            try {
                                ite.value = ite?.value?.map((it) => it.name).toString();
                            } catch (error) {
                                ite.value = '';
                            }
                        }
                    });
                }
                if (isArray(target?.request?.query?.parameter)) {
                    target.request.query.parameter = target.request.query.parameter.filter(
                        (ite) => ite.key !== ''
                    );
                }
            }
        }
        if (target_type === 'folder') {
            target.request.header =
                target?.request?.header?.filter((ite) => ite.key !== '') || target.request.header;
            target.request.body =
                target?.request?.body?.filter((ite) => ite.key !== '') || target.request.body;
            target.request.query =
                target?.request?.query?.filter((ite) => ite.key !== '') || target.request.query;
        }
        return target;
    };

    const addSceneItem = async (data, callback) => {
        const { type, pid, param } = data;
        let newScene = getBaseCollection(type);
        console.log(newScene);
        if (!newScene) return;
        newScene.parent_id = parseInt(pid);
        if (isPlainObject(param)) {
            newScene = { ...newScene, ...param };
        }
        newScene['team_id'] = parseInt(sessionStorage.getItem('team_id'));
        delete newScene['target_id'];

        console.log(newScene);
        // return;
        fetchCreateScene(newScene).subscribe({
            next: async (resp) => {
                console.log(resp);
                const { code } = resp;
                if (code === 0) {
                    callback && callback();
                    global$.next({
                        action: 'RELOAD_LOCAL_SCENE',
                    });
                }
            }
        })
    }

    const addSceneGroupItem = async (data, callback) => {
        console.log(data);
        const { type, pid, param } = data;
        let newSceneGroup = getBaseCollection(type);
        console.log(newSceneGroup);
        if (!newSceneGroup) return;
        newSceneGroup.parent_id = parseInt(pid);
        if (isPlainObject(param)) {
            newSceneGroup = { ...newSceneGroup, ...param };
        }
        newSceneGroup['team_id'] = parseInt(sessionStorage.getItem('team_id'));
        delete newSceneGroup['target_id'];

        console.log(newSceneGroup);
        // return;
        fetchCreateGroup(newSceneGroup).subscribe({
            next: async (resp) => {
                console.log(resp);
                const { code } = resp;
                if (code === 0) {
                    callback && callback();
                    global$.next({
                        action: 'RELOAD_LOCAL_SCENE',
                    });
                }
            }
        })

        // setTimeout(() => {
        //     // 刷新左侧目录列表
        //     global$.next({
        //         action: 'RELOAD_LOCAL_COLLECTIONS',
        //     });
        // }, 100);

    }

    const addCollectionItem = async (data, callback) => {
        console.log(data);
        const { type, pid, param } = data;
        let newCollection = getBaseCollection(type);
        console.log(newCollection);
        // newCollection.project_id = CURRENT_PROJECT_ID || '-1';
        if (!newCollection) return;
        if (isString(pid) && pid.length > 0) {
            newCollection.parent_id = parseInt(pid);
        }
        if (isPlainObject(param)) {
            newCollection = { ...newCollection, ...param };
        }

        // sort 排序
        // if (newCollection?.sort == -1) await targetReorder(newCollection);

        // 过滤key为空的值
        // filterEmptyKey(newCollection);

        // 添加本地库
        // await Collection.put(newCollection, newCollection?.target_id);
        // 上传服务器 失败走异步任务
        newCollection['team_id'] = parseInt(sessionStorage.getItem('team_id'));
        delete newCollection['target_id'];
        console.log(newCollection);
        // return;
        fetchHandleFolder(newCollection).subscribe({
            next: async (resp) => {
                console.log(resp);
                const { code } = resp;
                if (code === 0) {
                    global$.next({
                        action: 'RELOAD_LOCAL_COLLECTIONS',
                    });
                    callback && callback();
                }
                return;
                if (resp?.code === 10000) {
                    // 成功保存
                } else {
                    // 失败存异步任务
                    pushTask(
                        {
                            task_id: newCollection.target_id,
                            action: 'SAVE',
                            model: newCollection?.target_type.toUpperCase(),
                            payload: newCollection.target_id,
                            project_id: CURRENT_PROJECT_ID,
                        },
                        -1
                    );
                }
            },
            error: () => {
                // 失败存异步任务
                pushTask(
                    {
                        task_id: newCollection.target_id,
                        action: 'SAVE',
                        model: newCollection?.target_type.toUpperCase(),
                        payload: newCollection.target_id,
                        project_id: CURRENT_PROJECT_ID,
                    },
                    -1
                );
            },
        });

    };
    const busUpdateCollectionById = async (req, callback) => {
        const { id, data, oldValue } = req;
        console.log(id, data, oldValue);
 
        const collection = cloneDeep(oldValue);
        const params = {
            ...collection,
            ...data
        };
        console.log(params);
        fetchHandleFolder(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    callback && callback();
                    // 刷新左侧目录列表
                    global$.next({
                        action: 'RELOAD_LOCAL_COLLECTIONS',
                    });
                }
            }
        })
    };
    // 删除目录区某个集合 通过id
    const deleteCollectionById = async (id) => {
        const deleteIds = Array.isArray(id) ? id : [id];

        for (const targetId of deleteIds) {
            Collection.update(targetId, {
                status: -1,
                update_dtime: dayjs().valueOf(),
            }).then(() => {
                // 删除opens
                Bus.$emit('removeOpenItem', targetId);
            });
        }

        // todo
        global$.next({
            action: 'RELOAD_LOCAL_COLLECTIONS',
            payload: CURRENT_PROJECT_ID,
        });
    };

    // 批量新增
    const bulkAddCollection = async (
        targets,
        project_id,
        RELOAD_LOCAL_COLLECTIONS = true
    ) => {
        try {
            await Collection.bulkPut(targets);
            const resp = await lastValueFrom(
                addMultiTargetRequest({
                    targets,
                    is_socket: 1,
                    project_id,
                })
            );
            if (resp.code !== 10000) {
                // 失败存异步任务
                pushTask(
                    {
                        task_id: uuidv4(),
                        action: 'BATCHSAVE',
                        model: 'API',
                        payload: targets,
                        project_id,
                    },
                    -1
                );
            }
        } catch (error) {
            pushTask(
                {
                    task_id: uuidv4(),
                    action: 'BATCHSAVE',
                    model: 'API',
                    payload: targets,
                    project_id,
                },
                -1
            );
        }
        RELOAD_LOCAL_COLLECTIONS &&
            global$.next({
                action: 'RELOAD_LOCAL_COLLECTIONS',
                payload: project_id,
            });
    };

    useEffect(() => {
        // 修改collection 数据 （包括indexedDB和redux）
        global$
            .pipe(
                filter((d) => d.action === 'UPDATE_COLLECTION_BY_ID'),
                map((d) => d.payload),
                concatMap(updateCollectionById),
                switchMap(async () => {
                    const userData = await User.get(localStorage.getItem('uuid'));
                    global$.next({
                        action: 'RELOAD_LOCAL_COLLECTIONS',
                        payload: userData?.workspace?.CURRENT_PROJECT_ID || '-1',
                    });
                })
            )
            .subscribe();

        global$
            .pipe(
                filter((d) => d.action === 'RELOAD_LOCAL_COLLECTIONS'),
                map((d) => d.payload),
                concatMap(getApiList$),
                switchMap(async ({ data: { targets } }) => {
                    const tempApiList = {};
                    for (let i = 0; i < targets.length; i++) {
                        tempApiList[targets[i].target_id] = targets[i];
                    }
                    dispatch({
                        type: 'apis/updateApiDatas',
                        payload: tempApiList,
                    });
                })
            )
            .subscribe();

        global$
            .pipe(
                filter((d) => d.action === 'RELOAD_LOCAL_SCENE'),
                map((d) => d.payload),
                concatMap(getSceneList$),
                switchMap(async ({ data: { targets } }) => {
                    const tempSceneList = {};
                    if (targets instanceof Array) {
                        for (let i = 0; i < targets.length; i++) {
                            tempSceneList[targets[i].target_id] = targets[i];
                        }
                    }
                    dispatch({
                        type: 'scene/updateSceneDatas',
                        payload: tempSceneList
                    })
                })
            )
            .subscribe();
    }, []);
    useEventBus('bulkAddCollection', bulkAddCollection, []);
    useEffect(() => {
        Bus.$on('addCollectionItem', addCollectionItem);
        Bus.$on('addSceneGroupItem', addSceneGroupItem);
        Bus.$on('addSceneItem', addSceneItem);
        Bus.$on('busUpdateCollectionById', busUpdateCollectionById);
        Bus.$on('deleteCollectionById', deleteCollectionById);

        return () => {
            const offArr = ['addCollectionItem', 'busUpdateCollectionById', 'deleteCollectionById'];
            // 销毁订阅
            offArr.forEach((i) => {
                Bus.$off(i);
            });
        };
    }, [CURRENT_PROJECT_ID]);
};

export default useCollection;
