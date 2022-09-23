import React, { useEffect, useState } from 'react';
import './index.less';
import 'echarts/lib/echarts';
import ReactEcharts from 'echarts-for-react';
import { useParams } from 'react-router-dom';
import { fetchMachine } from '@services/report';
import dayjs from 'dayjs';

const PressMonitor = () => {
    let base = +new Date(1988, 9, 3);
    let oneDay = 24 * 3600 * 1000;
    let _data = [[base, Math.random() * 300]];
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [metrics, setMetrics] = useState([]);
    const { id: report_id } = useParams();

    useEffect(() => {

        const query = {
            report_id,
        };
        fetchMachine(query).subscribe({
            next: (res) => {
                const { data: { start_time_sec, end_time_sec, metrics } } = res;
                setStartTime(start_time_sec);
                setEndTime(end_time_sec);
                setMetrics(metrics);
            }
        })
    }, [])
    // for (let i = 1; i < 20000; i++) {
    //     let now = new Date((base += oneDay));
    //     _data.push([+now, Math.round((Math.random() - 0.5) * 20 + _data[i - 1][1])]);
    // }
    let getOption = (name, data) => {
        // let x_data = [];
        // let y_data = [];
        data.forEach(item => {
            item[0] = dayjs(item[0] * 1000).format('hh:mm');
            // x_data.push(item[0] * 1000);
            // y_data.push(item[1]);
        })
        let option = {
            title: {
                text: name,
                left: 'center',
                textStyle: {
                    color: '#fff',
                    fontSize: 14
                },
            },
            tooltip: {
                trigger: 'axis',
                position: function (pt) {
                    return [pt[0], '10%'];
                }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                axisLabel: {
                    color: '#fff',
                },
                // axisTick: {
                //     length: 1,
                //     lineStyle: {
                //       type: 'dashed'
                //       // ...
                //     }
                // },
                // axisLabel: {
                //     //  X 坐标轴标签相关设置，写在xAxis里面
                //     interval: 0,//全部标签显示
                //     rotate: '45'//标签倾斜度数
                //   }
                // data: x_data,
            },
            yAxis: {
                type: 'value',
                boundaryGap: [0, '100%'],
                axisLabel: {
                    color: '#fff',
                },
                splitLine: {
                    lineStyle: {
                        color: '#39393D'
                    }
                }
            },
            // dataZoom: [
            //     {
            //         type: 'inside',
            //         start: 0,
            //         end: 20
            //     },
            //     {
            //         start: 0,
            //         end: 20
            //     }
            // ],
            series: [
                {
                    name,
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    areaStyle: {},
                    data,
                }
            ]
        };

        return option;
    }

    return (
        <div className='press-monitor'>
            {
               metrics.length > 0 && metrics.map(item => (
                    <div className='monitor-list'>
                    <ReactEcharts className='echarts' option={getOption('cpu', item.cpu)} />
                    <ReactEcharts className='echarts' option={getOption('disk_io', item.disk_io)} />
                    <ReactEcharts className='echarts' option={getOption('mem', item.mem)} />
                    <ReactEcharts className='echarts' option={getOption('net_io', item.net_io)} />
                </div>
                ))
            }
        </div>
    )
};

export default PressMonitor;