import React, { useState, useEffect } from 'react';
import './index.less';
import { Button, Input, Message, Modal, Tooltip } from 'adesign-react';
import {
    Left as SvgLeft,
    Save as SvgSave,
    CaretRight as SvgCareRight
} from 'adesign-react/icons';
import avatar from '@assets/logo/avatar.png';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import TaskConfig from '../taskConfig';
import { cloneDeep } from 'lodash';
import Bus from '@utils/eventBus';
import { fetchPlanDetail, fetchSavePlan, fetchRunPlan, fetchStopPlan, fetchCreatePlan } from '@services/plan';
import dayjs from 'dayjs';
import SvgSendEmail from '@assets/icons/SendEmail';
import SvgStop from '@assets/icons/Stop';

const DetailHeader = () => {
    const navigate = useNavigate();
    const [preSet, setPreSet] = useState(false);
    const [mode, setMode] = useState(1);
    const [mode_conf, setModeConf] = useState({});
    const [task_type, setTaskType] = useState(1);
    const [cron_expr, setCronExpr] = useState('');
    const open_plan = useSelector((store) => store.plan.open_plan);
    const task_config = useSelector((store) => store.plan.task_config);
    const { id: plan_id } = useParams();
    const [planDetail, setPlanDetail] = useState({});

    useEffect(() => {
        getReportDetail();
    }, [plan_id]);

    const getReportDetail = () => {
        const query = {
            team_id: localStorage.getItem('team_id'),
            plan_id,
        };
        fetchPlanDetail(query).subscribe({
            next: (res) => {
                const { data: { plan } } = res;
                setPlanDetail(plan);
            }
        })
    }

    const savePreSet = (e) => {

    }

    const statusList = {
        '1': '未开始',
        '2': <p style={{ color: '#3CC071' }}>进行中</p>,
    }

    const onConfigChange = (type, value) => {
        if (type === 'task_type') {
            setTaskType(value);
        } else if (type === 'cron_expr') {
            setCronExpr(value);
        } else if (type === 'mode') {
            setMode(value);
        } else {
            const _mode_conf = cloneDeep(mode_conf);
            _mode_conf[type] = value;
            setModeConf(_mode_conf);
        }
    };

    const changePlanInfo = (type, value) => {
        let params = {
            team_id: parseInt(localStorage.getItem('team_id')),
            name: planDetail.name,
            remark: planDetail.remark,
            plan_id: parseInt(plan_id),
        };
        params[type] = value;
        fetchCreatePlan(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code !== 0) {
                    Message('error', '修改失败!');
                }
            }
        })
    }

    return (
        <div className='detail-header'>
            {
                preSet && (
                    <Modal title='预设配置' okText='保存' onOk={() => {
                        const { task_type, mode, cron_expr, mode_conf } = task_config;
                        Bus.$emit('savePreConfig', { task_type, mode, cron_expr, mode_conf }, () => {
                            setPreSet(false);
                            Message('success', '保存成功!');
                        })
                    }} visible onCancel={() => setPreSet(false)}>
                        <TaskConfig onChange={(type, value) => onConfigChange(type, value)} from="preset" />
                    </Modal>
                )
            }
            <div className='detail-header-left'>
                <SvgLeft onClick={() => navigate('/plan/list')} />
                <div className='detail'>
                    <div className='detail-top'>
                        <p className='name'>
                            计划管理/
                            <Tooltip
                                placement="top"
                                content={<div>{planDetail.name}</div>}
                            >
                              <div>
                                 <Input value={planDetail.name} onBlur={(e) => changePlanInfo('name', e.target.value)} />
                              </div>
                            </Tooltip>
                        </p>
                        <p className='status'>
                            {statusList[planDetail.status]}
                        </p>
                    </div>
                    <div className='detail-bottom'>
                        <div className='item'>
                            <p>创建人：{planDetail.created_user_name}</p>
                            <img src={avatar} />
                            <p style={{ marginLeft: '4px' }}></p>
                        </div>
                        <div className='item'>
                            创建时间：{dayjs(planDetail.created_time_sec * 1000).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                        <div className='item'>
                            最后修改时间：{dayjs(planDetail.updated_time_sec * 1000).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                        <div className='item'>
                            计划描述: 
                            <Input value={planDetail.remark} onBlur={(e) => changePlanInfo('remark', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            <div className='detail-header-right'>
                <Button className='notice' onClick={() => setPreSet(true)}>预设配置</Button>
                <Button className='notice' preFix={<SvgSendEmail width="16" height="16" />} onClick={() => setSendEmail(true)}>通知收件人</Button>
                {
                    planDetail.status === 1
                        ? <Button className='run' preFix={<SvgCareRight width="16" height="16" />} onClick={() => Bus.$emit('runPlan', plan_id, (code) => {
                            if (code === 0) {
                                getReportDetail();
                            } else {
                                Message('error', '操作失败!');
                            }
                        })}>开始运行</Button>
                        : <Button className='stop' preFix={<SvgStop width="10" height="10" />} onClick={() => Bus.$emit('stopPlan', plan_id, (code) => {
                            if (code === 0) {
                                Message('success', '停止成功!');
                                getReportDetail();
                            } else {
                                Message('error', '停止失败!');
                            }
                        })} >停止运行</Button>
                }
            </div>
        </div>
    )
};

export default DetailHeader;