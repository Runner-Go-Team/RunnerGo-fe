import React, { useEffect, useState } from 'react';
import './index.less';
import { Table } from 'adesign-react';
import { 
    Iconeye as SvgEye,
    Export as SvgExport,
    Delete as SvgDelete    
} from 'adesign-react/icons';
import { fetchReportList } from '@services/report';
import { tap } from 'rxjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const RecentReport = () => {

    const [reportList, setReportList] = useState([]);
    const navigate = useNavigate();

    const modeList = {
        '1': '并发模式',
        '2': '阶梯模式',
        '3': '错误率模式',
        '4': '响应时间模式',
        '5': '每秒请求数模式',
        '6': '每秒事务数模式'
    };

    const taskLit = {
        '0': '普通任务',
        '1': '定时任务',
    };

    useEffect(() => {
        const query = {
            page: 1,
            size: 10,
            team_id: sessionStorage.getItem('team_id'),
            keyword: '',
            start_time_sec: '',
            end_time_sec: '',
        }
        fetchReportList(query)
        .pipe(
            tap((res) => {
                const { code, data } = res;
                if (code === 0) {
                    const { reports } = data;
                    const list = reports.map((item, index) => {
                        const { report_id, name, task_type, mode, run_time_sec, last_time_sec, run_user_name, status } = item;
                        return {
                            report_id,
                            name,
                            mode: modeList[mode],
                            task_type: taskLit[task_type],
                            run_time_sec: dayjs(run_time_sec * 1000).format('YYYY-MM-DD hh:mm:ss'),
                            last_time_sec: dayjs(last_time_sec * 1000).format('YYYY-MM-DD hh:mm:ss'),
                            run_user_name,
                            status: status === 1 ? <p style={{color: '#3CC071'}}>运行中</p> : <p>未开始</p>,
                            operation: <HandleContent />
                        }
                    });
                    setReportList(list);
                }
            })
        )
        .subscribe();
    }, []);

    const HandleContent = () => {
        return (
            <div className='handle-content'>
                <SvgEye onClick={() => navigate('/report/detail')} />
                <SvgExport />
                <SvgDelete className='delete' />
            </div>
        )
    };
    const columns = [
        {
            title: '测试报告ID',
            dataIndex: 'report_id',
        },
        {
            title: '计划名称',
            dataIndex: 'name',
        },
        {
            title: '场景名称',
            dataIndex: 'scene_name',
        },
        {
            title: '任务模式',
            dataIndex: 'task_type',
        },
        {
            title: '压测模式',
            dataIndex: 'mode',
        },
        {
            title: '运行时间',
            dataIndex: 'run_time_sec',
        },
        {
            title: '最后修改时间',
            dataIndex: 'last_time_sec'
        },
        {
            title: '执行者',
            dataIndex: 'run_user_name',
        },
        {
            title: '状态',
            dataIndex: 'status',
        },
        {
            title: '操作',
            dataIndex: 'operation'
        }
    ];

    return (
        <div className='recent-report'>
            <p className='title'>近期测试报告</p>
            <div className='report-search'></div>
            <Table className="report-table" showBorder columns={columns} data={reportList} noDataElement={<p className='empty'>还没有数据</p>} />
        </div>
    )
};

export default RecentReport;