import { useMutation } from '@tanstack/react-query';
import FINGERPRINT from 'assets/fingerprint.png';
import type { AxiosResponse } from 'axios';
import { useDebounce } from 'hooks';
import { useNotify } from 'hooks';
import { useGetCreate2Address } from 'hooks/useGetCreate2Address';
import type { ModalController } from 'hooks/useModal';
import { authenticate, register } from 'module/webauthn';
import { getInitChallange, sendInitUserOp } from 'module/webauthn';
import { encodeChallenge, getPublicKey } from 'module/webauthnUtils';
import { useGetAccountQueryV2 } from 'queries/useGetAccountQueryV2';
import { useEffect, useState } from 'react';
import { browserName } from 'react-device-detect';
import { IoIosArrowBack } from 'react-icons/io';
import { useDispatch, useSelector } from 'react-redux';
import { apiCreateAccountV2 } from 'restapi';
import type { AccountV2, CreateAccountDto } from 'restapi/types';
import type { RootState } from 'store';
import {
    setAccount,
    setAuthenticationResponse,
    setDeployedContractAddress,
    setRegistrationResponse,
} from 'store/slicers/account';
import { setConnectionOption } from 'store/slicers/connection';
import { ConnectionOptions } from 'types/connection';
import { Button, Input } from 'ui';

import styles from './CreateAccount.module.scss';

export function CreateAccount({
    infoModal,
    setInfo,
    accountName,
    setAccountName,
}: {
    infoModal: ModalController;
    setInfo: (value: string) => void;
    accountName: string;
    setAccountName: (accountName: string) => void;
}): JSX.Element {
    const notify = useNotify();
    const dispatch = useDispatch();
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const connectionOption = useSelector(
        (state: RootState) => state.connection.connectionOption,
    );

    const debounced = useDebounce(accountName, 500);
    const { data, isLoading } = useGetAccountQueryV2(debounced);

    const { mutate: postAccount } = useMutation({
        mutationFn: async (
            params: CreateAccountDto,
        ): Promise<AxiosResponse<AccountV2>> => apiCreateAccountV2(params),
        onError: (e) => {
            setLoading(false);
            infoModal.close();
            notify.error('Account could not be created!');
            console.log(e);
        },
        onSuccess: (data) => {
            setLoading(false);
            infoModal.close();
            notify.success(`Account created successfully <3`);
            dispatch(setAccount(data.data));
        },
    });

    const handleRegister = async (): Promise<void> => {
        if (accountName === '') return;
        if (errorMessage !== '') return;
        try {
            setInfo('CREATEREGISTER');
            infoModal.open();
            const registrationResponse = await register(accountName);
            if (registrationResponse) {
                setInfo('CREATEAUTH');
                setLoading(true);
                dispatch(setRegistrationResponse(registrationResponse));
                const publicKey: string = await getPublicKey(
                    registrationResponse?.credential.publicKey,
                );

                const create2Address: string = await useGetCreate2Address(
                    publicKey,
                );
                console.log('create2Address', create2Address);
                const challenge = await getInitChallange(
                    create2Address,
                    publicKey,
                );
                const encodedChallenge = encodeChallenge(challenge);
                const authenticationResponse = await authenticate(
                    registrationResponse.credential.id,
                    encodedChallenge,
                );
                dispatch(setAuthenticationResponse(authenticationResponse));
                console.log('authenticationResponse', authenticationResponse);
                if (authenticationResponse) {
                    setInfo('TXSENT');
                    const res = await sendInitUserOp(
                        challenge,
                        publicKey,
                        encodedChallenge,
                        authenticationResponse.signature,
                        authenticationResponse.authenticatorData,
                        authenticationResponse.clientData,
                        create2Address,
                    );

                    if (res) {
                        setLoading(false);
                        dispatch(setDeployedContractAddress(create2Address));
                        postAccount({
                            name: accountName,
                            address: create2Address,
                            authName: browserName
                                ? (browserName as string)
                                : 'desktop',
                            authPublic: publicKey,
                            authType: 1,
                        } as CreateAccountDto);
                    }
                }
            }
        } catch (e) {
            infoModal.close();
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data) {
            setErrorMessage('This username is already taken!');
        }
    }, [data]);

    useEffect(() => {
        setErrorMessage('');
    }, [connectionOption]);

    useEffect(() => {
        setLoading(false);
        setErrorMessage('');
    }, []);

    return (
        <div className={styles.wrapper}>
            <div
                className={styles.back}
                onClick={(): void => {
                    dispatch(setConnectionOption(ConnectionOptions.CONNECT));
                }}
            >
                <IoIosArrowBack size={20} />
            </div>
            <div className={styles.title}>
                <div className={styles.fingerprint}>
                    <img src={FINGERPRINT.src}></img>
                </div>
                <span className={styles.text}>Create New Account</span>
            </div>
            <div className={styles.nickname}>
                <Input
                    color="dark"
                    placeholder="Username"
                    height="40px"
                    error={errorMessage}
                    value={accountName}
                    onChange={(e): void => {
                        setAccountName(e.target.value);
                        setErrorMessage('');
                    }}
                    onKeyPress={async (e): Promise<void> => {
                        if (
                            e.key === 'enter' ||
                            e.key === 'Enter' ||
                            e.key === 'NumpadEnter'
                        ) {
                            await handleRegister();
                        }
                    }}
                />
            </div>
            <div className={styles.button}>
                <Button
                    disabled={
                        accountName === '' || isLoading || errorMessage !== ''
                    }
                    width="120px"
                    height="40px"
                    color="purple"
                    loading={
                        !accountName === null ? isLoading : false || loading
                    }
                    onClick={async (): Promise<void> => {
                        await handleRegister();
                    }}
                >
                    Register
                </Button>
            </div>
        </div>
    );
}
