import React, { useMemo, useState } from 'react';
import { Input, Table, Switch, Select, Button } from 'adesign-react';
import { useSelector, useDispatch } from 'react-redux';
import { Delete as DeleteSvg, Down as DownSvg, Right as RightSvg } from 'adesign-react/icons';
import { dataItem, newDataItem } from '@constants/dataItem';
import Bus from '@utils/eventBus';
import { HEADERTYPELIST } from '@constants/typeList';
import cloneDeep from 'lodash/cloneDeep';
import ApiInput from '@components/ApiInput';
import SearchInput from '@components/SearchInput';
import AutoSizeTextArea from '@components/AutoSizeTextArea';
import DescChoice from '@components/descChoice';
import { isString, trim } from 'lodash';
import { REQUEST_HEADER } from '@constants/api';
import Importexport from '../importExport';
import { COMPARE_IF_TYPE } from '@constants/compare';

import { useTranslation } from 'react-i18next';
const { Option } = Select;

const Regular = (props) => {
    const { parameter, onChange } = props;

    const { t } = useTranslation();

    const handleTableDelete = (index) => {
        console.log(index);
        const newList = [...parameter];
        if (newList.length > 0) {
            console.log(parameter);
            newList.splice(index, 1);
            console.log(newList);
            onChange('regex', [...newList]);
        }
    };

    const handleChange = (rowData, rowIndex, newVal) => {
        const newList = [...parameter];
        newList[rowIndex] = {
            ...rowData,
            ...newVal,
        };
        onChange('regex', [...newList]);
    }


    const columns = [
        {
            title: '',
            width: 40,
            dataIndex: 'is_checked',
            render: (text, rowData, rowIndex) => (
                <Switch
                    size="small"
                    checked={text === '1' || text === 1}
                    onChange={(e) => {
                        handleChange(rowData, rowIndex, { is_checked: e ? 1 : -1 });
                    }}
                />
            ),
        },
        {
            title: t('apis.type'),
            width: 150,
            dataIndex: 'type',
            // enableResize: true,
            render: (text, rowData, rowIndex) => (
                <Select
                    value={rowData ? rowData.type : 0}
                    placeholder={t('placeholder.plsSelect')}
                    onChange={(e) => {
                        console.log(e, text, rowData, rowIndex);
                        handleChange(rowData, rowIndex, { type: e });
                    }}
                >
                    <Option value={0}>??????</Option>
                    <Option value={1}>json</Option>
                </Select>
            ),
        },
        {
            title: t('apis.varName'),
            dataIndex: 'var',
            // enableResize: true,
            render: (text, rowData, rowIndex) => (
                <Input
                    size="mini"
                    value={text}
                    onChange={(newVal) => {
                        handleChange(rowData, rowIndex, { var: newVal });
                    }}
                />
            ),
        },
        {
            title: t('apis.expression'),
            dataIndex: 'express',
            // enableResize: true,
            render: (text, rowData, rowIndex) => {
                return (
                    <Input
                        size="mini"
                        value={text}
                        onChange={(newVal) => {
                            handleChange(rowData, rowIndex, { express: newVal });
                        }}
                    />
                );
            },
        },
        {
            title: t('apis.desc'),
            dataIndex: 'val',
            // enableResize: true,
            render: (text, rowData, rowIndex) => {
                return (
                    <Input
                        size="mini"
                        value={text}
                        onChange={(newVal) => {
                            handleChange(rowData, rowIndex, { val: newVal });
                        }}
                    />
                );
            },
        },
        {
            title: '',
            width: 30,
            render: (text, rowData, rowIndex) => (
                <Button
                    onClick={() => {
                        handleTableDelete(rowIndex);
                    }}
                >
                    <DeleteSvg style={{ width: 16, height: 16 }} />
                </Button>
            ),
        },
    ];

    const tableDataList = () => {
        return [...parameter, { is_checked: 1, type: 0, var: '', express: '', val: '' }]
    };

    return (
        <div className='apipost-req-wrapper'>
            <Table showBorder hasPadding={false} columns={columns} data={tableDataList()} />
        </div>
    )
};

export default Regular;