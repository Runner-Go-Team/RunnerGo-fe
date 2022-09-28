import React, { useEffect, useState } from 'react';
import { Modal, Table, Upload, Button, Input, Message } from 'adesign-react';
import { Copy as SvgCopy, Add as SvgAdd, Delete as SvgDelete } from 'adesign-react/icons';
import { GlobalVarModal, HeaderTitleStyle, VarNameStyle } from './style';
import { copyStringToClipboard, str2testData } from '@utils';
import OSS from 'ali-oss';
import { v4 } from 'uuid';
import { fetchImportVar, fetchImportList, fetchSceneVar, fetchChangeVar, fetchDeleteImport } from '@services/scene';
import { useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import PreviewFile from '../PreviewFile';

const SceneConfig = (props) => {
    const { onCancel, from } = props;
    const open_scene_scene = useSelector((store) => store.scene.open_scene);
    const open_plan_scene = useSelector((store) => store.plan.open_plan_scene);

    const open_scene = from === 'scene' ? open_scene_scene : open_plan_scene;
    const [fileList, setFileList] = useState([]);
    const [varList, setVarList] = useState([]);
    const [checkName, setCheckName] = useState([]);
    const [showPreview, setPreview] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [fileType, setFileType] = useState('');

    const handleChange = (rowData, rowIndex, newVal) => {
        const newList = [...varList];
        newList[rowIndex] = {
            ...rowData,
            ...newVal,
        };
        if (rowIndex === varList.length - 1) {
            setVarList([...newList, { var: '', val: '', description: '' }])
        } else {
            setVarList([...newList]);
        }
    };

    useEffect(() => {
        if (open_scene) {
            const query = {
                team_id: localStorage.getItem('team_id'),
                scene_id: open_scene.scene_id,
            };
            fetchImportList(query).subscribe({
                next: (res) => {
                    const { data: { imports } } = res;
                    const _imports = imports.map(item => {
                        let name = item.name.split('/');
                        return {
                            ...item,
                            path: item.name,
                            name: name[name.length - 1],
                        }
                    });
                    setFileList(_imports);
                }
            });
            fetchSceneVar(query).subscribe({
                next: (res) => {
                    const { data: { variables } } = res;
                    setVarList([...variables, { var: '', val: '', description: '' }]);
                }
            })
        }
    }, []);
    const columns = [
        {
            title: '变量名',
            dataIndex: 'var',
            width: 211,
            render: (text, rowData, rowIndex) => {
                return (
                    <div className={VarNameStyle}>
                        <Input
                            value={text}
                            onBlur={(e) => {
                                const _list = cloneDeep(varList);
                                const names = _list.filter(item => item.var === checkName[1]);
                                if (names.length > 1) {
                                    const length = _list[checkName[0]].var.length;
                                    _list[checkName[0]].var = _list[checkName[0]].var.substring(0, length - 1);
                                    setVarList(_list);
                                    Message('error', '变量名重复!');
                                }
                            }}
                            onChange={(newVal) => {
                                handleChange(rowData, rowIndex, { var: newVal });
                                setCheckName([rowIndex, newVal]);
                            }}
                        />
                        {rowIndex !== varList.length - 1 && <SvgCopy onClick={() => copyStringToClipboard(varList[rowIndex].var)} />}
                    </div>
                )
            }
        },
        {
            title: '变量值',
            dataIndex: 'val',
            render: (text, rowData, rowIndex) => {
                return (
                    <Input
                        value={text}
                        onChange={(newVal) => {
                            handleChange(rowData, rowIndex, { val: newVal });
                        }}
                    />
                )
            }
        },
        {
            title: '变量描述',
            dataIndex: 'description',
            render: (text, rowData, rowIndex) => {
                return (
                    <Input
                        value={text}
                        onChange={(newVal) => {
                            handleChange(rowData, rowIndex, { description: newVal });
                        }}
                    />
                )
            }
        },
        {
            title: '',
            width: 40,
            render: (text, rowData, rowIndex) => {
                return rowIndex !== varList.length - 1 ? <SvgDelete onClick={() => deleteItem(rowIndex)} className='delete-svg' /> : <></>
            }
        }
    ];

    const deleteItem = (index) => {
        const _list = [...varList];

        _list.splice(index, 1);

        setVarList(_list);
    }

    const VarName = () => {
        return (
            <div className={VarNameStyle}>
                <p>md5</p>
                <SvgCopy onClick={() => copyStringToClipboard('md5')} />
            </div>
        )
    }

    const data = [
        {
            var: 'name',
            val: '分光光度法个时的法国和函数说明',
            description: '分光光度法个时的法国和函数说明',
        },
        {
            var: 'name',
            val: '分光光度法个时的法国和函数说明',
            description: '分光光度法个时的法国和函数说明',
        },
        {
            var: 'name',
            val: '分光光度法个时的法国和函数说明',
            description: '分光光度法个时的法国和函数说明',
        },
    ];

    const HeaderTitle = () => {
        return (
            <div className={HeaderTitleStyle}>
                <p className='header-title'>全局变量</p>
            </div>
        )
    };

    const uploadFile = async (files, fileLists) => {
        const fileMaxSize = 1024 * 10;
        const fileType = ['csv', 'txt'];
        const { originFile: { size, name } } = files[0];
        const nameType = name.split('.')[1];
        if (fileLists.length === 5) {
            Message('error', '最多上传5个文件!');
            return;
        }
        if (size / 1024 > fileMaxSize) {
            Message('error', '文件过大!');
            return;
        };
        if (!fileType.includes(nameType)) {
            Message('error', '只支持csv和txt格式文件!');
            return;
        }
        const ossConfig = {
            region: 'oss-cn-beijing',
            accessKeyId: 'LTAI5tEAzFMCX559VD8mRDoZ',
            accessKeySecret: '5IV7ZpVx95vBHZ3Y74jr9amaMtXpCQ',
            bucket: 'apipost',
        };
        const client = new OSS(ossConfig);
        const { name: res_name, url } = await client.put(
            `kunpeng/test/${v4()}.${nameType}`,
            files[0].originFile,
        )
        const params = {
            team_id: parseInt(localStorage.getItem('team_id')),
            scene_id: open_scene.scene_id,
            name: res_name,
            url,
        };
        fetchImportVar(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    let name = res_name.split('/');
                    const importFile = {
                        name: name[name.length - 1],
                        path: res_name,
                        url,
                    };

                    const _fileList = cloneDeep(fileList);
                    _fileList.push(importFile);
                    setFileList(_fileList)
                    Message('success', '上传成功!');
                }
            }
        })
        // const { originFile: { size, name } } = files[0];
        // const isBig = size / 1024 / 1024 / 1024
    };

    const saveGlobalVar = () => {
        const _list = cloneDeep(varList);
        _list.splice(_list.length - 1, 1);
        const variables = _list.map(item => {
            const { var: _var, val, description } = item;
            return {
                var: _var,
                val,
                description
            };
        });
        const params = {
            team_id: parseInt(localStorage.getItem('team_id')),
            scene_id: parseInt(open_scene.scene_id),
            variables
        };
        fetchChangeVar(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    Message('success', '保存成功!');
                    onCancel();
                }
            },
            err: (err) => {
                Message('error', '保存失败!');
            }
        });
    };

    const deleteFile = (name) => {
        const params = {
            team_id: parseInt(localStorage.getItem('team_id')),
            scene_id: open_scene.scene_id,
            name,
        };
        fetchDeleteImport(params).subscribe({
            next: (res) => {
                const { code } = res;
                if (code === 0) {
                    Message('success', '删除成功!');
                    const _fileList = cloneDeep(fileList);
                    const _index = _fileList.findIndex(item => item.path === name);
                    _fileList.splice(_index, 1);
                    setFileList(_fileList);
                } else {
                    Message('error', '删除失败!');
                }
            }
        })
    };

    const previewFile = async (url) => {
        const result = await fetch(url);
        const file = await result.blob();

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = reader.result;

            const testData = str2testData(text);

            setPreviewData(testData.length > 0 ? testData : text);
            setFileType(testData.length > 0 ? 'csv' : 'txt');
            setPreview(true);
        };

        reader.readAsText(file);
    };

    const downloadFile = async (name, url) => {

        const result = await fetch(url);
        const file = await result.blob();
        let a = document.createElement('a');
        let _url = window.URL.createObjectURL(file);
        let filename = name;
        a.href = _url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(_url);
        document.body.removeChild(a);
    }

    return (
        <Modal className={GlobalVarModal} visible={true} title="场景设置" okText='保存' onOk={() => saveGlobalVar()} onCancel={onCancel} >
            <p className='container-title'>添加文件</p>
            <span>支持添加10M以内的csv、txt文件</span>
            <div className='file-list'>
                {
                    fileList.map(item => (
                        <div className='file-list-item'>
                            <div className='file-list-item-left'>
                                {item.name}
                            </div>
                            <div className='file-list-item-right'>
                                <p onClick={() => previewFile(item.url)}>预览</p>
                                <p onClick={() => downloadFile(item.name, item.url)}>下载</p>
                                <p className='delete' onClick={() => deleteFile(item.path)}>删除</p>
                            </div>
                        </div>
                    ))
                }
            </div>
            <Upload showFilesList={false} onChange={(files, fileList) => uploadFile(files, fileList)}>
                <Button preFix={<SvgAdd />}>添加文件</Button>
            </Upload>
            <p className='container-title'>添加变量</p>
            <Table showBorder columns={columns} data={varList} />
            { showPreview && <PreviewFile fileType={fileType} data={previewData} onCancel={() => setPreview(false)} /> }
        </Modal>
    )
};

export default SceneConfig;