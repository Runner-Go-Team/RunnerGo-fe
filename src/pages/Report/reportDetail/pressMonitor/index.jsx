import React, { useEffect } from 'react';
import './index.less';
import 'echarts/lib/echarts';
import ReactEcharts from 'echarts-for-react';
import { useParams } from 'react-router-dom';
import { fetchMachine } from '@services/report';

const PressMonitor = () => {
    let base = +new Date(1988, 9, 3);
    let oneDay = 24 * 3600 * 1000;
    let data = [[base, Math.random() * 300]];
    const { id: report_id } = useParams();

    useEffect(() => {

        const query = {
            report_id: 136,
        };
        fetchMachine(query).subscribe({
            next: (res) => {
                // console.log(res);
            }
        })
    })
    for (let i = 1; i < 20000; i++) {
        let now = new Date((base += oneDay));
        data.push([+now, Math.round((Math.random() - 0.5) * 20 + data[i - 1][1])]);
    }
    let getOption = () => {
        let option = {
            tooltip: {
                trigger: 'axis',
                position: function (pt) {
                    return [pt[0], '10%'];
                }
            },
            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisLabel: {
                    color: '#fff',
                },
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
                    name: 'Fake Data',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    areaStyle: {},
                    data: data
                }
            ]
        };

        return option;
    }

    return (
        <div className='press-monitor'>
            <div className='monitor-list'>
                <ReactEcharts className='echarts' option={getOption()} />
                <ReactEcharts className='echarts' option={getOption()} />
                <ReactEcharts className='echarts' option={getOption()} />
                <ReactEcharts className='echarts' option={getOption()} />
            </div>
        </div>
    )
};

export default PressMonitor;