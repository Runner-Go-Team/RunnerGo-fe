/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep, findIndex, uniqBy, remove, filter, isObject } from 'lodash';
import { Modal, Button, Input, Select, CheckBox, Message, Spin } from 'adesign-react';
import { FE_BASEURL } from '@config/index';
import {
  getTeamListWithProject,
  getProjectInviteUrl,
  addProjectPersonnel,
  getInviteRole,
  getTeamPlaceCount,
} from '@services/projects';
import Subtract from '@assets/invite/subtract.svg';
import ConnectIcon from '@assets/invite/blueconnect.svg';
import UnionIcon from '@assets/invite/union.svg';
import { EamilReg, copyStringToClipboard } from '@utils';
import { InviteModalWrapper } from './style';
import './index.less';
import PaymentModal from './Payment/modal';
import PayAddSuccessModal from './PayAddSuccessModal';

import { fetchInviteMember, fetchGetRole, fetchGetLink } from '@services/user';
import { fetchEmailList, fetchDeleteEmail } from '@services/plan';
import { fetchSendPlanEmail } from '@services/plan';
import { fetchSendReportEmail } from '@services/report';
import Bus from '@utils/eventBus';
import { tap } from 'rxjs';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import qs from 'qs';
import { useDispatch } from 'react-redux';

import InvitateSuccess from '../InvitateSuccess';

const Option = Select.Option;
const InvitationModal = (props) => {
  const { t, i18n } = useTranslation();
  const project_id = useSelector((store) => store?.workspace?.CURRENT_PROJECT_ID);
  const team_id = useSelector((store) => store?.workspace?.CURRENT_TEAM_ID);
  const userInfo = useSelector((store) => store.user.userInfo);

  const { projectInfoAll, onCancel, email, from } = props;

  const [projectList, setProjectList] = useState([]);
  const [addList, setAddList] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState(2);
  const [needBuyStation, setNeedBuyStation] = useState(0);
  const [groupCode, setGroupCode] = useState(0);
  const [successPer, setSuccessPer] = useState(0);
  const [payAddSuccessVisible, setPayAddSuccessVisible] = useState(false);
  const [noRegisters, setNoRegisters] = useState(0);
  const [payvisible, setPayvisible] = useState(false);
  const [ifSelectAll, setIfSelectAll] = useState(false);
  const [usedStation, setUsedStation] = useState(0);
  const [remainderStation, setRemainderStation] = useState(0);
  const [linkPower, setLinkPower] = useState(2);
  const [role, setRole] = useState([]);
  const [spinning, setSpinning] = useState(true);
  const current_project_id = project_id;
  const current_team_id = team_id;

  const { search } = useLocation();
  const { id: report_id } = qs.parse(search.slice(1));
  const { id: plan_id } = useParams();

  const [userRole, setUserRole] = useState(null);

  const [addLength, setAddLength] = useState(0);
  const [unRegister, setUnRegister] = useState(0);
  const [unEmail, setUnEmail] = useState([]);
  const [invitateSuccess, setInvitateSuccess] = useState(false);

  const [oldList, setOldList] = useState([]);
  const dispatch = useDispatch();

  const changeTeamInvitation = (type, invitationPersonnel) => {
    const inputTempValue = invitationPersonnel?.email || inputValue.trim();
    const selectTempValue = selectValue;
    let teampAddList = cloneDeep(addList);
    const tempProjectList = cloneDeep(projectList);
    const index = findIndex(tempProjectList, { user: { email: inputTempValue } });
    const projectListIndex = projectList.findIndex(
      (i) => i.user.email === invitationPersonnel?.email || i.user.email === inputTempValue
    );
    if (type === 'add') {
      if (!EamilReg(inputTempValue)) {
        Message('error', '?????????????????????????????????');
        return;
      }
      if (teampAddList.length >= 50) {
        Message('error', '??????????????????50??????');
        return;
      }
      if (
        tempProjectList.findIndex((ii) => inputTempValue === ii.user.email && ii.in_project) > -1
      ) {
        Message('error', '????????????????????????');
        return;
      }
      if (selectValue === 'readonly') {
        teampAddList = [
          {
            key: uuidv4(),
            email: inputTempValue,
            power: selectTempValue,
            noAdd: projectListIndex > -1,
          },
          ...teampAddList,
        ];
      } else {
        teampAddList = [
          {
            key: uuidv4(),
            email: inputTempValue,
            power: selectValue,
            noAdd: projectListIndex > -1 && projectList[projectListIndex]?.is_readonly === 1,
          },
          ...teampAddList,
        ];
      }
      teampAddList = uniqBy(teampAddList, 'email');
      // ??????????????????????????????
      setInputValue('');
    } else if (type === 'delete') {
      if (from === 'plan') {
        const params = {
          plan_id: parseInt(plan_id),
          team_id: parseInt(localStorage.getItem('team_id')),
          email_id: parseInt(invitationPersonnel.id)
        };
        fetchDeleteEmail(params).subscribe({
          next: (res) => {
            const { code } = res;

            if (code === 0) {
              const index = addList.findIndex(item => item.id === invitationPersonnel.id);
              if (index !== -1) {
                const _addList = cloneDeep(addList);
                _addList.splice(index, 1);
                setAddList(_addList);
              }
              dispatch({
                type: 'plan/updateEmailList',
                payload: addList,
              })
            }
          }
        });
      } else {
        remove(teampAddList, (n) => invitationPersonnel.key === n.key);
      }
    } else if (type === 'change') {
      filter(teampAddList, (i) => {
        if (i.key === invitationPersonnel.key) {
          i.power = invitationPersonnel.power;
        }
        return i;
      });
    }
    const d = teampAddList.filter((ii) => ii?.noAdd && ii?.power !== 'readonly');
    let usedStationTemp = usedStation;
    let usedStationTemp1 = usedStation - d.length;
    for (let i = teampAddList.length - 1; i >= 0; i--) {
      const add = teampAddList[i];
      if (add.power !== 'readonly') {
        if (add?.noAdd) {
          usedStationTemp1++;
          teampAddList[i].usedStation = usedStationTemp1;
        } else {
          usedStationTemp++;
          teampAddList[i].usedStation = usedStationTemp;
        }
      }
    }
    if (usedStationTemp > remainderStation) {
      setNeedBuyStation(usedStationTemp - remainderStation);
    } else {
      setNeedBuyStation(0);
    }
    // ????????????????????????????????????
    if (index !== -1) {
      setProjectList(
        (pre) =>
          pre &&
          pre.map((i) => {
            if (
              (i.user.email === invitationPersonnel?.email || i.user.email === inputTempValue) &&
              type !== 'change'
            ) {
              i.checked = type === 'add';
            }
            return i;
          })
      );
    }
    setAddList(teampAddList);
  };

  useEffect(() => {
    // getTeamPlaceCount({ team_id: current_team_id }).subscribe({
    //   next(resp) {
    //     if (resp?.code === 10000) {
    //       setRemainderStation(resp.data.write);
    //       setUsedStation(parseInt(resp.data.write, 10) - parseInt(resp.data.reste_write, 10));
    //     }
    //   },
    // });
    // getTeamListWithProject({
    //   team_id: current_team_id,
    //   project_id: current_project_id,
    // }).subscribe({
    //   next(res) {
    //     if (res?.code === 10000) {
    //       setProjectList(res.data);
    //     }
    //   },
    // });
    const query = {
      team_id: localStorage.getItem('team_id'),
    };
    fetchGetRole(query).subscribe({
      next: (res) => {
        const { data: { role_id } } = res;
        setRole(role_id);
        if (role_id === 2) {
          setSelectValue(2)
        }
      }
    })
    if (plan_id) {
      const _query = {
        plan_id,
        team_id: localStorage.getItem('team_id'),
      }
      fetchEmailList(_query).subscribe({
        next: (res) => {
          const { data: { emails } } = res;
          const oldList = emails.map(item => {
            return {
              key: uuidv4(),
              email: item.email,
              id: item.id
            }
          })
          setAddList([...addList, ...oldList]);
          setOldList(oldList);
        }
      })
    }
    // getInviteRole({ project_id: current_project_id }).subscribe({
    //   next(resp) {
    //     if (resp?.code === 10000) {
    //       setRole(resp.data.role);
    //       if (resp.data.role && resp.data.role.length === 1 && resp.data.role[0] === 1) {
    //         setSelectValue('readonly');
    //       }
    //     }
    //   },
    // });
    setSpinning(false);
  }, [plan_id]);

  const computeStation = (item) => {
    if (item.power === 'readonly') {
      return <span className="free-span">??????</span>;
    }
    if (item.usedStation > remainderStation) {
      return <span className="need-buy-span">?????????</span>;
    }
    return <span className="surplus-span">{`${item.usedStation}/${remainderStation}`}</span>;
  };

  const renderOptions = () => {
    if (role.length > 0) {
      const result = [];
      role.forEach((item) => {
        switch (item) {
          case 1:
            result.push(
              <Option key="readonly" value="readonly">
                ????????????
              </Option>
            );
            break;
          case 2:
            result.push(
              <Option key="readwrite" value="readwrite">
                ????????????
              </Option>
            );
            break;
          default:
            break;
        }
      });
      return result;
    }
    return [];
  };

  // ??????????????????
  const checkShouldOnChange = (checked) => {
    if (!checked) {
      return true;
    }
    const teampAddList = cloneDeep(addList);
    if (teampAddList.length >= 50) {
      Message('error', '??????????????????50??????');
      return false;
    }
    return true;
  };

  // ??????????????????
  const teamPersonnelCheckOne = (item, val, isALl = false) => {
    // shouldOnChange={(checked) => checkShouldOnChange(checked)}
    const checked = val === 'checked' || val === true;
    const shouldChange = checkShouldOnChange(checked);
    if (!shouldChange && !checked) return;

    const teampList = cloneDeep(projectList);
    let teampAddList = cloneDeep(addList);
    const userRole = role.filter((ite) => ite === 2).length > 0;
    const { user } = item;
    if (teampAddList.length >= 50) {
      Message('error', '??????????????????50??????');
      return false;
    }
    setProjectList(
      filter(teampList, (o) => {
        if (item.uuid === o.uuid) {
          o.checked = checked;
        }
        return o;
      })
    );

    if (checked) {
      let tempRead = {};
      if (
        findIndex(teampAddList, (o) => o.email === user?.email || o.uuid === item.uuid) === -1
      ) {
        tempRead = {
          key: uuidv4(),
          email: user?.email,
          uuid: item.uuid,
          power: item.is_readonly === 1 && userRole ? 'readwrite' : 'readonly',
          nick_name: user?.nick_name,
          portrait: user?.portrait,
          noAdd: item.is_readonly === 1,
        };
        if (isALl) {
          return tempRead;
        }
        teampAddList = [tempRead, ...teampAddList];
      }
    } else {
      if (isALl) {
        return item;
      }
      remove(teampAddList, (l) => l.email === user.email || l.uuid === item.uuid);
    }
    const d = teampAddList.filter((ii) => ii?.noAdd && ii?.power !== 'readonly');
    let usedStationTemp = usedStation;
    let usedStationTemp1 = usedStation - d.length;
    for (let i = teampAddList.length - 1; i >= 0; i--) {
      const add = teampAddList[i];
      if (add.power !== 'readonly') {
        if (add?.noAdd) {
          usedStationTemp1++;
          teampAddList[i].usedStation = usedStationTemp1;
        } else {
          usedStationTemp++;
          teampAddList[i].usedStation = usedStationTemp;
        }
      }
    }
    if (usedStationTemp > remainderStation) {
      setNeedBuyStation(usedStationTemp - remainderStation);
    } else {
      setNeedBuyStation(0);
    }
    setAddList(teampAddList);
    return true;
  };
  const teamPersonnelCheckAll = () => {
    const tempList = cloneDeep(projectList);
    let teampAddList = cloneDeep(addList);
    let d = [];
    for (let index = tempList.length - 1; index >= 0; index--) {
      const item = tempList[index];
      if (!item.in_project) {
        const shouldCheck = checkShouldOnChange(!ifSelectAll);
        if (shouldCheck) {
          const personCheckOne = teamPersonnelCheckOne(item, !ifSelectAll, true);
          if (isObject(personCheckOne)) d = [personCheckOne, ...d];
          if (!personCheckOne) {
            return null;
          }
        } else {
          return null;
        }
      }
    }
    setProjectList((preSate) => {
      const data =
        preSate &&
        preSate.map((it) => {
          it = {
            ...it,
            checked: !ifSelectAll,
          };
          return it;
        });
      return data;
    });

    if (!ifSelectAll) {
      teampAddList = [...d, ...teampAddList];
    } else {
      teampAddList = teampAddList.filter((it) => {
        const index =
          d && d.findIndex((item) => item.uuid === it.uuid || item.user.email === it.email);
        return !(index > -1);
      });
    }
    let usedStationTemp = usedStation;
    let usedStationTemp1 = usedStation - d.filter((ii) => ii?.power !== 'readonly').length;
    for (let i = teampAddList.length - 1; i >= 0; i--) {
      const add = teampAddList[i];
      if (add.power !== 'readonly') {
        if (add?.noAdd) {
          usedStationTemp1++;
          teampAddList[i].usedStation = usedStationTemp1;
        } else {
          usedStationTemp++;
          teampAddList[i].usedStation = usedStationTemp;
        }
      }
    }
    if (usedStationTemp > remainderStation) {
      setNeedBuyStation(usedStationTemp - remainderStation);
    } else {
      setNeedBuyStation(0);
    }
    teampAddList = uniqBy(teampAddList, 'email');
    setAddList(teampAddList);
    setIfSelectAll(!ifSelectAll);
  };
  const onSubmit = () => {
    if (addList.length < 1) {
      return;
    }
    if (!email && !from) {
      const params = {
        team_id: parseInt(localStorage.getItem('team_id')),
        members: addList.map(item => {
          return {
            email: item.email,
            role_id: item.power
          }
        })
      }
      fetchInviteMember(params)
        .pipe(
          tap((res) => {
            const { code, data: { register_num, un_register_emails, un_register_num } } = res;

            if (code === 0) {
              setAddLength(register_num);
              setUnRegister(un_register_num);
              setUnEmail(un_register_emails);
              setInvitateSuccess(true);
              Message('success', t('message.invitateSuccess'));
              Bus.$emit('getTeamMemberList');
              setAddList([]);
              console.log(register_num, un_register_num, un_register_emails);
              onCancel({
                addLength: register_num,
                unRegister: un_register_num,
                unEmail: un_register_emails
              })
            } else {
              Message('error', t('message.invitateError'));
            }
          })
        )
        .subscribe();
    } else {
      let params = {};
      if (from === 'plan') {
        console.log(addList, oldList);
        params = {
          plan_id: parseInt(plan_id),
          emails: addList.filter(item => !item.id && (oldList.findIndex(elem => elem.id === item.id) === -1)).map(item => item.email)
        };
        fetchSendPlanEmail(params).subscribe({
          next: (res) => {
            const { code } = res;
            if (code === 0) {
              Message('success', t('message.addSuccess'));
              dispatch({
                type: 'plan/updateEmailList',
                payload: addList,
              })
              onCancel();
            } else {
              Message('error', t('message.addError'));
            }
          }
        })
      } else {
        params = {
          team_id: parseInt(localStorage.getItem('team_id')),
          report_id: parseInt(report_id),
          emails: addList.map(item => item.email)
        };
        fetchSendReportEmail(params).subscribe({
          next: (res) => {
            const { code } = res;
            if (code === 0) {
              Message('success', t('message.sendSuccess'));
              onCancel();
            } else {
              Message('error', t('message.sendError'));
            }
          }
        })
      }
    }

    return;
    const submitObj = {
      project_id: current_project_id,
      invitees: [],
    };
    const teampAddList = cloneDeep(addList);
    teampAddList.forEach((item) => {
      if (item.email && item.email.length > 0) {
        submitObj.invitees.push({
          email: item.email,
          role: item.power === 'readonly' ? 1 : 2,
        });
      } else {
        submitObj.invitees.push({
          uuid: item.uuid,
          role: item.power === 'readonly' ? 1 : 2,
        });
      }
    });
    if (submitObj?.invitees?.length < 1) {
      Message('error', '???????????????????????????');
      return;
    }
    addProjectPersonnel(submitObj).subscribe({
      next(resp) {
        if (resp?.code === 10000) {
          setSuccessPer(resp.data.success);
          setNoRegisters(resp.data.not_registers);
          setGroupCode(resp.data.group_code);
          if (resp.data.reserve && resp.data.reserve > 0) {
            setNeedBuyStation(resp.data.reserve);
            setPayvisible(true);
          } else {
            setPayAddSuccessVisible(true);
          }
        }
      },
    });
  };
  const PayAddSuccessModalClose = () => {
    projectInfoAll && projectInfoAll(current_project_id);
    onCancel && onCancel();
  };
  return (
    <>
      {payAddSuccessVisible && (
        <PayAddSuccessModal
          noRegistersPre={noRegisters}
          successPer={successPer}
          onCancel={PayAddSuccessModalClose}
        />
      )}
      
      {/* {
        invitateSuccess &&
          <InvitateSuccess addLength={addLength} unRegister={unRegister} unEmail={unEmail}  onCancel={() => setInvitateSuccess(false)} />
      } */}
      <PaymentModal
        visible={payvisible}
        setvisible={() => {
          setPayvisible(false);
        }}
        needBuyStation={needBuyStation}
        successPer={successPer}
        noRegisters={noRegisters}
        groupCode={groupCode}
        onSuccessCancel={PayAddSuccessModalClose}
      />

      {
        <Modal
          className={InviteModalWrapper}
          visible
          onCancel={onCancel}
          title={null}
          footer={null}
        >
          {/* <Spin loading={spinning}></Spin> */}
          <div className="modal-inviation-title">
            <div>{from ? t('btn.notifyEmail') : t('modal.invitation')}</div>
            {/* <div>{ t('modal.addTeamMem') }</div> */}
          </div>
          <div className="team-inviation-content">
            <div className="team-inviation-add">
              <div className="team-inviation-add-operation">
                <Input
                  value={inputValue}
                  placeholder={!email ? t('placeholder.invitedEmail') : t('placeholder.email')}
                  // inputStyle={{ width: '80%' }}
                  onChange={(val) => setInputValue(val)}
                  maxLength={30}
                // onPressEnter={() => changeTeamInvitation('add')}
                />
                {
                  !email ?
                    role !== 2 ?
                      <Select style={{ right: '85px' }} value={selectValue} onChange={(key) => setSelectValue(key)}>
                        <Option value={3}>{t('modal.roleList.1')}</Option>
                        <Option value={2}>{t('modal.roleList.0')}</Option>
                      </Select>
                      : <p className='only-common' style={{ right: '85px' }}>{t('modal.roleList.0')}</p>
                    : ''
                }
                <Button
                  // className="apipost-blue-btn"
                  style={{ color: '#fff' }}
                  onClick={() => changeTeamInvitation('add')}
                >
                  {t('btn.ok')}
                </Button>
              </div>
              <div className="team-invitation-add-list">
                {addList.map((item, index) => (
                  <div className="team-invitation-add-list-item" key={index}>
                    {item.email && item.email.length > 0 ? (
                      <span>
                        <Input
                          value={item.email}
                          readonly
                          placeholder=""
                        // inputStyle={{ width: '90%' }}
                        />
                        <div
                          className="api-close-btn"
                          onClick={() => changeTeamInvitation('delete', item)}
                        >
                          <UnionIcon></UnionIcon>
                        </div>
                      </span>
                    ) : (
                      <span>
                        <img src={item?.portrait} alt="portrait" />
                        {item.nick_name}
                      </span>
                    )}

                    <span style={{ padding: '0 16px' }}>
                      {
                        !email ?
                          role !== 2 ?
                            <Select
                              value={item.power}
                              defaultValue="common"
                              onChange={(key) => {
                                item.power = key;
                                changeTeamInvitation('change', item);
                              }}
                            >
                              {/* {renderOptions()} */}
                              <Option value={3}>{t('modal.roleList.1')}</Option>
                              <Option value={2}>{t('modal.roleList.0')}</Option>
                            </Select>
                            : <p className='only-common'>{t('modal.roleList.0')}</p>
                          : ''
                      }
                    </span>
                    {/* {computeStation(item)} */}
                  </div>
                ))}
              </div>
            </div>
            {/* <div className="team-inviation-project-list">
              <div className="team-inviation-project-list-header">
                <span>{ t('modal.teamMem') }</span>
                <span onClick={teamPersonnelCheckAll}>{ t('btn.selectAll') }</span>
              </div>
              <div className="team-invitation-project-list-content">
                {projectList &&
                  projectList.map((item, index) => (
                    <div key={index} className="team-invitation-project-list-content-item">
                      <span>
                        <img
                          src={item?.user?.portrait}
                          alt=""
                          style={{ width: '30px', height: '30px' }}
                        />
                      </span>
                      <div>
                        <div>{item.user.nick_name}</div>
                        {item.user.email ? <div>{item.user.email}</div> : ''}
                      </div>
                      <span>{item.is_readonly === 1 ? '????????????' : '????????????'}</span>
                      <span>
                        <CheckBox
                          checked={
                            (item.in_project ? item.in_project : item.checked)
                              ? 'checked'
                              : 'uncheck'
                          }
                          disabled={item.in_project}
                          onChange={(checked) => teamPersonnelCheckOne(item, checked)}
                        />
                      </span>
                    </div>
                  ))}
              </div>
            </div> */}
          </div>
          <div className="team-inviation-footer">
            <div className="team-inviation-footer-l">
              {
                !from ? <>
                  <span className="know-link-people">{t('modal.knowUrl')}</span>
                  {
                    role !== 2 ? <Select defaultValue={3} disabled={role === 2} value={linkPower} onChange={(key) => setLinkPower(key)}>
                      <Option value={3}>{t('modal.roleList.1')}</Option>
                      <Option value={2}>{t('modal.roleList.0')}</Option>
                    </Select> : <p className='only-common'>{t('modal.roleList.0')}</p>
                  }
                  <div
                    className="team-inviation-link"
                    type="link"
                    onClick={() => {
                      const params = {
                        team_id: localStorage.getItem('team_id'),
                        role_id: linkPower
                      };
                      fetchGetLink(params).subscribe({
                        next: (res) => {
                          const { code, data: { url } } = res;
                          if (code === 0) {
                            copyStringToClipboard(
                              url,
                              true
                            );
                          }
                        }
                      })
                    }}
                  >
                    <ConnectIcon></ConnectIcon>
                    {t('modal.copyUrl')}
                  </div>
                </> : ''
              }
            </div>
            <div className="team-inviation-footer-r">
              {/* <span className="team-inviation-footer-need-buy-span">
                {needBuyStation && needBuyStation > 0 ? (
                  <Subtract style={{ marginRight: '8px' }}></Subtract>
                ) : null}
                {needBuyStation && needBuyStation > 0 ? `?????????${needBuyStation}???????????????` : null}
              </span> */}
              <Button onClick={onSubmit}>
                {/* {needBuyStation > 0 ? '?????????????????????' : '??????????????????'} */}
                {from === 'report' ? t('btn.send') : t('btn.addMem')}
              </Button>
            </div>
          </div>
        </Modal>
      }
    </>
  );
};
export default InvitationModal;
