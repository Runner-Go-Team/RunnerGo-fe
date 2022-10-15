import React, { useState, useEffect } from 'react';
import { Input, Button, Message } from 'adesign-react';
import './index.less';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import cn from 'classnames';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [pwd, setPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');

    const [pwdDiff, setPwdDiff] = useState(false);

    const resetPwd = () => {
        if (Object.keys(vcodeObj).length === 0) {
            return Message('error', t('message.check'));
        }
        if (pwdDiff) {
            return;
        }

    }

    const checkPwd = () => {
        if (pwd !== confirmPwd) {
            setPwdDiff(true);
        } else {
            setPwdDiff(false);
        }
    }
    return (
        <div className="reset-password">
            <div className='title'>{t('sign.reset')}</div>
            <Input
                className="reset-input"
                placeholder={t('placeholder.newPwd')}
                value={pwd}
                onChange={(value) => {
                    setPwd(value);
                }}
            />
            <Input
                className={cn('reset-input', { 'input-error': pwdDiff })}
                placeholder={t('placeholder.confirmPwd')}
                value={confirmPwd}
                onChange={(value) => {
                    setConfirmPwd(value);
                }}
                onBlur={() => checkPwd()}
            />
            { pwdDiff && <p className='error-tips'>{ t('sign.confirmError') }</p> }
            <Button onClick={() => resetPwd()}>{t('sign.reset')}</Button>
        </div>
    )
};

export default ResetPassword;