import { client } from '@passwordless-id/webauthn';
import type {
    AuthenticationEncoded,
    RegistrationEncoded,
} from '@passwordless-id/webauthn/dist/esm/types';
import { ABIs } from 'constants/abi';
import { ADDRESSES } from 'constants/address';
// import 'dotenv/config';
import { Contract, ethers } from 'ethers';
import {
    WebauthnOptions,
    getSignatureVerifyParamEncoded,
} from 'module/webauthnHelper';
import { getDefaultUserOp } from 'module/webauthnUtils';
import type { UserOperationWithSignature } from 'module/webauthnUtils';

// const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';

export const getEntrypointContract = async (
    alchemy_key = '',
): Promise<Contract> => {
    const provider: ethers.providers.AlchemyProvider =
        new ethers.providers.AlchemyProvider(alchemy_key);

    const contract: Contract = new Contract(
        ADDRESSES.entryPoint,
        ABIs.entrypointContract,
        provider,
    );

    return contract;
};

export const getChallange = async (
    _senderAddress = '',
    _signature = '0x',
): Promise<string> => {
    const contract = await getEntrypointContract();

    const userOp: UserOperationWithSignature = getDefaultUserOp(
        _senderAddress,
        _signature,
    );

    const response = await contract.getUserOpHash(userOp);

    return response;
};

export const register = async (
    user = 'seal',
    challenge = 'seal',
): Promise<RegistrationEncoded> => {
    const registration = await client.register(
        user,
        challenge,
        WebauthnOptions.registerOptions,
    );
    return registration;
};

export const authenticate = async (
    credentialId: string,
    challenge: string,
): Promise<AuthenticationEncoded> => {
    const login = await client.authenticate(
        [credentialId],
        challenge,
        WebauthnOptions.authOptions,
    );

    return login;
};

export const sendUserOpToEntrypoint = async (
    _senderAddress = '',
    _signature = '0x',
    _beneficiary = '0x114B242D931B47D5cDcEe7AF065856f70ee278C4',
    _challenge: string,
    _webauthnPublicKey: string,
    _encodedChallenge: string,
    _signatureBase64: string,
    _authenticatorData: string,
    _clientData: string,
) => {
    const signature: string = await getSignatureVerifyParamEncoded(
        _authenticatorData,
        _clientData,
        _challenge,
        _webauthnPublicKey,
        _signatureBase64,
    );

    const contract: Contract = await getEntrypointContract();

    const userOp: UserOperationWithSignature = getDefaultUserOp(
        _senderAddress,
        signature,
    );

    const response = await contract.handleOps([userOp], _beneficiary, {
        gasLimit: 5000000,
    });

    return response;
};
