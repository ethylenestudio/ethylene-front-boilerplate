import { Container } from '@ethylene/components';
import {
  useAddress,
  useConnection,
  useProvider,
  useSigner,
} from '@ethylene/hooks';
import { NextPage } from 'next';
import { useRef } from 'react';

const Components: NextPage = () => {
  const { connect, disconnect, isConnected } = useConnection({
    onConnect: () => {
      console.log('Connected');
    },
  });

  const { provider } = useProvider();
  const signer = useSigner();
  const address = useAddress();

  const ref = useRef<HTMLDivElement>(null);
  return (
    <div>
      {isConnected && <div>Connected: {address}</div>}
      <Container forwardedRef={ref}>components</Container>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>disconnect</button>
      <button onClick={() => console.log(provider)}>Provider</button>
      <button onClick={async () => console.log(await provider?.getNetwork())}>
        Chain
      </button>
      <button onClick={() => console.log(signer)}>Signer</button>
      <button onClick={() => console.log(address)}>Address</button>
    </div>
  );
};

export default Components;
