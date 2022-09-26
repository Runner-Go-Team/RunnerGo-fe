import React, { useState, useEffect } from 'react';
import './index.less';
import { Button, Dropdown, Message } from 'adesign-react';
import {
    LogoutRight as SvgLogout,
    InviteMembers as SvgInvite
} from 'adesign-react/icons';
import avatar from '@assets/logo/avatar.png'
import InvitationModal from '@modals/ProjectInvitation';
import ProjectMember from '@modals/ProjectMember';
import TeamworkLogs from '@modals/TeamworkLogs';
import SingleUser from './SingleUser';
import { fetchTeamMemberList } from '@services/user';
import { tap } from 'rxjs';
import { useSelector } from 'react-redux';
import { global$ } from '@hooks/useGlobal/global';
import { useNavigate } from 'react-router-dom';


const HeaderRight = () => {
    const [showModal, setShowModal] = useState(false);
    const [showMember, setMemberModal] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [memberList, setMemberList] = useState([]);

    const [outsideClose, setOutsideClose] = useState(true);

    const teamMember = useSelector((store) => store.teams.teamMember);
    const navigate = useNavigate();


    useEffect(() => {
        // global$.next({
        //     action: 'INIT_APPLICATION',
        // });
        // setMemberList()
        // const query = {
        //     team_id: 10
        // }
        // fetchTeamMemberList(query)
        //     .pipe(
        //         tap((res) => {
        //             const { code, data: { members } } = res;
        //             setMemberList(members);
        //             // if (code === 0) {
        //             //     let dataList = [];
        //             //     dataList = members.map((item, index) => {
        //             //         const { avatar, email, nickname, join_time_sec } = item;
        //             //         const userInfo = {
        //             //             avatar,
        //             //             email,
        //             //             nickname
        //             //         }
        //             //         return {
        //             //             member: <MemberInfo userInfo={userInfo}  />,
        //             //             joinTime: dayjs(join_time_sec * 1000).format('YYYY-MM-DD HH:mm:ss'),
        //             //             // invitedBy: '七七',
        //             //             stationType: '读写工位',
        //             //             handle: <p style={{cursor: 'pointer'}} onClick={() => removeMember(item.user_id)}>移除成员</p>,
        //             //         }
        //             //     });
        //             //     setData(dataList);
        //             // }
        //         })
        //     )
        //     .subscribe();
    }, []);

    const RenderMemberList = () => {
        return teamMember.slice(0, 1).map(item => (
            // <Dropdown
            //     content={
            //         <div className="online-list">
            //             <SingleUser
            //                 useMsg={item}
            //                 currentUser={item}
            //             ></SingleUser>
            //         </div>
            //     }
            // >
                <div className='person-avatar'>
                    <img src={item.avatar || avatar} alt="" />
                    {/* <div className='person-status'></div> */}
                </div>
            // </Dropdown>
        ))
    };

    const loginOut = () => {
        localStorage.removeItem('kunpeng-token');
        localStorage.removeItem('expire_time_sec');
        localStorage.removeItem('team_id');
        localStorage.removeItem('settings');
        navigate('/login');
        Message('success', '退出成功!');
    };

    return (
        <div className='header-right'>
            <div className='team-person'>
                <RenderMemberList />
                <div className='person-number' onClick={() => setMemberModal(true)}>
                    <p>{teamMember.length}</p>
                </div>
            </div>
            <Button className='invite' preFix={<SvgInvite />} onClick={() => setShowModal(true)}>邀请协作</Button>
            <div className='more-btn'>
                <Button className='handle-log' onClick={() => setShowLog(true)}>操作日志</Button>
                <Button className='handle-log' preFix={<SvgLogout />} onClick={() => loginOut()}>退出</Button>
            </div>
            {showModal && <InvitationModal onCancel={() => {
                setShowModal(false);
            }} />}
            {showMember && <ProjectMember onCancel={() => {
                setMemberModal(false);
            }} />}
            {showLog && <TeamworkLogs onCancel={() => {
                setShowLog(false);
            }} />}
        </div>
    )
};

export default HeaderRight;