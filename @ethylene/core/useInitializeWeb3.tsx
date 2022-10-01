import { getDefaultProvider } from '@ethylene/core/getDefaultProvider';
import {
  useProvider,
  useSetAddress,
  useSetProvider,
  useSetSigner,
} from '@ethylene/redux/web3/Web3ReducerHooks';
import { ethers } from 'ethers';
import { useEffect } from 'react';

export const useInitializeWeb3 = () => {
  const setProvider = useSetProvider();
  const setSigner = useSetSigner();
  const setAddress = useSetAddress();
  const provider = useProvider();

  useEffect(() => {
    const defaultExternalProvider = getDefaultProvider();
    if (defaultExternalProvider != null) {
      const _provider = new ethers.providers.Web3Provider(
        defaultExternalProvider,
      );
      setProvider(_provider);
    }
  }, [setProvider]);

  useEffect(() => {
    if (provider != null) {
      const _signer = provider.getSigner();
      setSigner(_signer);
      _signer.getAddress().then((address) => setAddress(address));
    }
  }, [provider, setSigner, setAddress]);
};
