import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Web3 from 'web3';
import styles from '../styles/Home.module.css';

const EthView = () => {
  const [web3, setWeb3Client] = useState<Web3>();
  // Apparently eth_accounts is either empty or array of a SINGLE address, plan is to allow more addresses in the future.
  const [accounts, setAccounts] = useState([]);
  const [gasPrice, setGasPrice] = useState('0'); // Yes, API is a string
  const [ethBalance, setEthBalance] = useState('0'); // Yes, API is a string

  useEffect(() => {
    const init = async () => {
      console.log('INIT');
      if (typeof window === 'undefined') {
        return;
      }

      window.ethereum.on('connect', ({ chainId }) => console.log('Connected to chain', chainId));
      window.ethereum.on('chainChanged', (chainId) => {
        // Handle the new chain.
        // Correctly handling chain changes can be complicated.
        // We recommend reloading the page unless you have good reason not to.
        if (confirm(`Chain Changed (${chainId}) Do you want to reload the page?`)) {
          window.location.reload();
        }
      });
      // Metamask can no longer connect to the network. Some connectivity errors typically.
      // window.ethereum.on('disconnect', (error) => console.log('Disconnected! Thanks!'));

      // Gets empty array if disconnected everything
      window.ethereum.on('accountsChanged', (accounts) => {
        // TODO: So there's a case where I can disconnect the active account and the site will get the other account address here
        // but MetaMask will stay in the other now disconnected account... Is there some extra UX that's possible here?
        console.log('Accounts changed', { accounts });
        setAccounts(accounts);
      });

      window.ethereum.on('message', (message) => console.log('Message:', message));
    };

    init();
  }, []);

  const handleAccountsChanged = (accounts) => setAccounts(accounts);

  const connectWithWeb3 = () => {
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        setWeb3Client(new Web3(Web3.givenProvider || window.ethereum));
        try {
          // This actually connects via MetaMask
          window.ethereum
            .request({ method: 'eth_requestAccounts' })
            .then(handleAccountsChanged)
            .catch((err) => {
              if (err.code === 4001) {
                // EIP-1193 userRejectedRequest error
                // If this happens, the user rejected the connection request.
                console.log('Please connect to MetaMask.');
              } else {
                console.error(err);
              }
            });
        } catch (e) {
          console.log('Oh no!', e);
        }
      }
      // Legacy DApp Browsers
      else if (window.web3) {
        setWeb3Client(new Web3(web3.currentProvider));
      }
      // Non-DApp Browsers
      else {
        alert('You have to install MetaMask !');
      }
    } else {
      console.log('Server render');
    }
  };

  const onGetAccount = () => {
    if (!web3) {
      console.log('Connect first');
      return;
    }

    // Local Ganache account index 1 private key
    // const privateKey = 'ed96a95e152f3334232769015d454819f28a78c470c8027659cccef816f1209a';

    // const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.getAccounts().then((accounts) => {
      console.log({ accounts });
      setAccounts(accounts);
    });
    // console.log({ account });
  };

  const onDisconnect = () => {
    // Maybe disconnecting is only a wallet thing and for the app it's just forgetting the state... maybe that's just how pancake swap does it.
  };

  // Use BigNumber (BN.js - https://github.com/indutny/bn.js/)
  const ethToWei = (amount) => {
    let decimals = web3.utils.toBN(18);
    // Bit redundant to convert? Can we type a BN?
    return web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(decimals)).toString(10);
  };
  const weiToEth = (amount) => {
    let decimals = web3.utils.toBN(18);
    console.log(amount);
    return web3.utils.toBN(amount).div(web3.utils.toBN(10).pow(decimals)).toString(10); // NO DECIMALS?!??!?? WTF???!??!
  };

  const sendEth = () => {
    if (!web3) {
      console.log('Connect first.');
      return;
    }

    // Ganache addresses #0 and #1
    let fromAddress = '0x940a4589E77e5e23002410773f6dE65C5a4E2a66';
    let toAddress = '0x52dD916B89acb5d1E1a9062ec649d31A9c47CF22';

    // Amount to be sent
    let amount = web3.utils.toBN(1); // convert to a big number

    // using the promise
    web3.eth
      .sendTransaction({
        from: fromAddress,
        to: toAddress,
        value: ethToWei(amount) // value in wei, this is 1 ETH, 18 zeros
      })
      .then(function (receipt) {
        console.log('Transaction', { receipt });
      });
  };

  const isMetaMask = (typeof window !== 'undefined' && window?.ethereum?.isMetaMask) || false;

  useEffect(() => {
    if (!web3) {
      return;
    }

    web3.eth.getGasPrice().then(setGasPrice);
  }, [web3]);

  useEffect(() => {
    if (!(accounts && accounts.length)) {
      return;
    }

    web3.eth.getBalance(accounts[0]).then(setEthBalance);
  }, [accounts]);

  return (
    <>
      <h1>Hello</h1>
      {/* Fix the error with using serverside vs client */}
      {isMetaMask ? <div>Seems you're using MetaMask 🦊</div> : null}
      <button onClick={connectWithWeb3} style={{ margin: '20px 0' }}>
        Connect
      </button>
      {accounts && accounts.length ? (
        <div style={{ marginBottom: 20 }}>
          {accounts.map((ethAddress, index) => (
            <div>
              #{index}: {ethAddress}
            </div>
          ))}
        </div>
      ) : null}
      {web3 ? (
        <>
          <div>Web3 lib version: {web3.version}</div>
          <div>Gas Price: {gasPrice}</div>
          <div>ETH: {weiToEth(ethBalance)} (noice!)</div>
          <button onClick={onGetAccount}>Get account</button>
          <button onClick={onDisconnect}>Disconnect</button>
          <button onClick={sendEth}>Send 1 ETH</button>
        </>
      ) : null}
    </>
  );
};

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <EthView />
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer">
          Powered by <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  );
}
