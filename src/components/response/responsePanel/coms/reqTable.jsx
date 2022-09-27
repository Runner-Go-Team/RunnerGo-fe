import React, { useState, useEffect } from 'react';
import { Table } from 'adesign-react';
import { combineLatest } from 'rxjs';

const ReqTable = (props) => {
  const { data } = props;
  const headerList = [];
  const reqHeader = data?.request_header || '';
  for (const key in reqHeader) {
    if (typeof reqHeader[key] === 'object') {
      for (const it in reqHeader[key]) {
        headerList.push({ key, value: reqHeader[key][it] });
      }
    } else {
      headerList.push({ key, value: reqHeader[key] });
    }
  }

  const [list, setList] = useState([...headerList]);
  useEffect(() => {
    setList([...headerList]);
  }, [data?.request_headers]);
  const columns = [
    {
      title: 'name',
      dataIndex: 'key',
      render: (text, rowData, rowIndex) => (
        <span className="table-cell-span">{rowData.key || rowData.name}</span>
      ),
    },
    {
      title: 'value', // 参数key String
      dataIndex: 'value',
      render: (text, rowData, rowIndex) => (
        <span className="table-cell-span">{text || '-'}</span>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* <Table showHeader={false} showBorder columns={columns} data={list} /> */}
      { reqHeader.split('\r').map(item => <p style={{ marginBottom: '10px' }}>{item}</p>) }
    </div>
  );
};

export default ReqTable;
