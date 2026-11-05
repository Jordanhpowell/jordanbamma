import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import './analyzer-dashboard.scss';

type AnalyzerDashboardProps = { handleTabChange: (active_number: number) => void };
type Tick = { quote: number; epoch: number; pip_size: number; symbol: string };
type DerivMessage = { msg_type?: string; error?: { message?: string }; tick?: Tick; active_symbols?: Array<{ underlying_symbol: string; underlying_symbol_name: string; market: string; is_trading_suspended: number }> };

const STRATEGIES = [
    { id: 'xrate', name: 'X Rate', detail: 'Matches / Differs analysis', tone: 'violet', icon: '◎' },
    { id: 'striker', name: 'Striker', detail: 'Accumulator contract setup', tone: 'green', icon: '↗' },
    { id: 'even-odd', name: 'Even and Odd', detail: 'Digit parity observation', tone: 'mint', icon: 'ϟ' },
    { id: 'higher-lower', name: 'Higher Lower', detail: 'Higher / Lower price movement', tone: 'teal', icon: '⇅' },
    { id: 'digit-ai', name: 'Digit AI', detail: 'Last-digit frequency analysis', tone: 'orange', icon: '✧' },
];

const FALLBACK_MARKETS = [
    { label: 'Volatility 10 Index', value: 'R_10' }, { label: 'Volatility 25 Index', value: 'R_25' },
    { label: 'Volatility 50 Index', value: 'R_50' }, { label: 'Volatility 75 Index', value: 'R_75' },
    { label: 'Volatility 100 Index', value: 'R_100' }, { label: 'Volatility 10 (1s) Index', value: '1HZ10V' },
    { label: 'Volatility 25 (1s) Index', value: '1HZ25V' }, { label: 'Volatility 50 (1s) Index', value: '1HZ50V' },
    { label: 'Volatility 75 (1s) Index', value: '1HZ75V' }, { label: 'Volatility 100 (1s) Index', value: '1HZ100V' },
    { label: 'Boom 500 Index', value: 'BOOM500' }, { label: 'Boom 1000 Index', value: 'BOOM1000' },
    { label: 'Crash 500 Index', value: 'CRASH500' }, { label: 'Crash 1000 Index', value: 'CRASH1000' },
];

const AnalyzerDashboard = observer(({ handleTabChange }: AnalyzerDashboardProps) => {
    const { client } = useStore();
    const [market, setMarket] = useState('R_100');
    const [markets, setMarkets] = useState(FALLBACK_MARKETS);
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
    const [ticks, setTicks] = useState<Tick[]>([]);
    const [feedStatus, setFeedStatus] = useState<'connecting' | 'live' | 'offline' | 'error'>('connecting');
    const [feedMessage, setFeedMessage] = useState('Connecting to Deriv market data…');

    const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    useEffect(() => {
        if (!appId) {
            setFeedStatus('offline');
            setFeedMessage('Live feed needs a Deriv App ID in the deployment environment.');
            return;
        }
        let socket: WebSocket | undefined;
        let active = true;
        setFeedStatus('connecting');
        setFeedMessage('Connecting to Deriv market data…');
        setTicks([]);
        try {
            socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent(appId)}`);
            socket.onopen = () => {
                if (!active) return;
                setFeedStatus('live');
                setFeedMessage('Connected · subscribing to live tick stream');
                socket?.send(JSON.stringify({ active_symbols: 'brief' }));
                socket?.send(JSON.stringify({ ticks: market, subscribe: 1 }));
            };
            socket.onmessage = event => {
                if (!active) return;
                try {
                    const data = JSON.parse(event.data) as DerivMessage;
                    if (data.error) {
                        setFeedStatus('error');
                        setFeedMessage(data.error.message || 'Deriv returned a market-data error.');
                        return;
                    }
                    if (data.msg_type === 'active_symbols' && data.active_symbols) {
                        const available = data.active_symbols
                            .filter(item => item.market === 'synthetic_index' && !item.is_trading_suspended)
                            .map(item => ({ label: item.underlying_symbol_name, value: item.underlying_symbol }));
                        if (available.length) setMarkets(available);
                    }
                    if (data.msg_type === 'tick' && data.tick?.symbol === market) {
                        setFeedStatus('live');
                        setFeedMessage('Live prices received directly from Deriv');
                        setTicks(current => [...current, data.tick as Tick].slice(-100));
                    }
                } catch {
                    setFeedMessage('Received an unreadable market-data message.');
                }
            };
            socket.onerror = () => {
                if (active) {
                    setFeedStatus('error');
                    setFeedMessage('Market feed connection failed. Check the deployment and try again.');
                }
            };
            socket.onclose = () => {
                if (active) {
                    setFeedStatus('offline');
                    setFeedMessage('Market feed disconnected. Change market or reload to reconnect.');
                }
            };
        } catch {
            setFeedStatus('error');
            setFeedMessage('Could not start the Deriv market-data connection.');
        }
        return () => {
            active = false;
            if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
        };
    }, [appId, market]);

    const latest = ticks[ticks.length - 1];
    const lastDigit = latest ? Number(latest.quote.toFixed(latest.pip_size).slice(-1)) : null;
    const digitCounts = useMemo(() => {
        const counts = Array(10).fill(0) as number[];
        ticks.forEach(tick => {
            const digit = Number(tick.quote.toFixed(tick.pip_size).slice(-1));
            if (Number.isInteger(digit) && digit >= 0 && digit <= 9) counts[digit] += 1;
        });
        return counts;
    }, [ticks]);
    const evenCount = digitCounts.reduce((sum, count, digit) => sum + (digit % 2 === 0 ? count : 0), 0);
    const oddCount = ticks.length - evenCount;
    const balance = useMemo(() => {
        const value = Number(client.balance);
        return Number.isFinite(value) ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : '—';
    }, [client.balance]);
    const toggleStrategy = (id: string) => setSelectedStrategies(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    const selectedMarket = markets.find(item => item.value === market)?.label ?? market;
    const price = latest ? latest.quote.toFixed(latest.pip_size) : 'Waiting for ticks';

    return (
        <main className='brown-analyzer'>
            <div className='brown-analyzer__intro'>
                <div>
                    <div className='brown-analyzer__eyebrow'><span className='brown-analyzer__pulse' /> POWELL BAMMA · DERIV SYNTHETIC MARKETS</div>
                    <h1>Powell Bamma Analyzer</h1>
                    <p>Live market intelligence and your Deriv bot-building workspace.</p>
                </div>
                <div className='brown-analyzer__market'>
                    <label htmlFor='deriv-market-select'>Synthetic market</label>
                    <select id='deriv-market-select' value={market} onChange={event => setMarket(event.target.value)}>
                        {markets.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
                    </select>
                </div>
            </div>

            <div className='brown-live-strip'>
                <div className='brown-live-strip__status'><i className={'brown-feed-dot brown-feed-dot--' + feedStatus} /> {feedStatus === 'live' ? 'LIVE MARKET FEED' : feedStatus.toUpperCase()}</div>
                <span>{feedMessage}</span>
                <small>{ticks.length} ticks captured · rolling sample of 100</small>
            </div>

            <div className='brown-analyzer__grid'>
                <section className='brown-panel brown-panel--account'>
                    <div className='brown-panel__heading'>
                        <h2><span className='brown-icon'>♙</span> Deriv Account</h2>
                        <span className={client.is_logged_in ? 'brown-status brown-status--connected' : 'brown-status'}><i /> {client.is_logged_in ? 'Connected' : 'Not connected'}</span>
                    </div>
                    <div className='brown-account-type'><span>Account Type:</span><strong>{client.is_logged_in ? (client.is_virtual ? 'Demo Account' : 'Live Account') : 'Not connected'}</strong>{client.is_logged_in && <span className='brown-account-id'>{client.loginid}</span>}</div>
                    <div className='brown-account-stats'>
                        <div className='brown-stat'><span>Account Balance</span><strong>{client.is_logged_in ? balance : '—'} <small>{client.is_logged_in ? client.currency : ''}</small></strong></div>
                        <div className='brown-stat'><span>Market Price</span><strong className='brown-price'>{price}</strong></div>
                    </div>
                    <div className='brown-account-foot'><span>{client.is_logged_in ? 'Account details supplied by your Deriv session.' : 'Use the Deriv Log in button in the app header to connect securely.'}</span><span>{selectedMarket}</span></div>
                </section>

                <section className='brown-panel brown-panel--history'>
                    <div className='brown-panel__heading'><h2><span className='brown-icon'>⌁</span> Live Digit Analysis</h2><span className='brown-history-count'>Observed ticks only</span></div>
                    <div className='brown-history-stats'>
                        <div className='brown-history-stat'><span>Latest last digit</span><strong>{lastDigit === null ? '—' : lastDigit}</strong><small>{lastDigit === null ? 'Waiting for live data' : 'From latest quoted price'}</small></div>
                        <div className='brown-history-stat'><span>Even / Odd</span><strong>{ticks.length ? `${evenCount} / ${oddCount}` : '—'}</strong><small>Even / odd in this sample</small></div>
                    </div>
                    <div className='brown-digit-bars' aria-label='Observed frequency of last digits zero through nine'>
                        {digitCounts.map((count, digit) => <div className='brown-digit-bar' key={digit}><span>{count}</span><div><i style={{ height: ticks.length ? `${Math.max(4, count / Math.max(...digitCounts, 1) * 100)}%` : '0%' }} /></div><b>{digit}</b></div>)}
                    </div>
                    <div className='brown-analysis-caption'>Digit frequency is descriptive, not a prediction or trading signal. It updates as new Deriv ticks arrive.</div>
                </section>

                <section className='brown-panel brown-panel--strategies'>
                    <div className='brown-panel__heading'><h2><span className='brown-icon'>▥</span> Strategy Workspace</h2><span className='brown-selected-count'>{selectedStrategies.length} selected</span></div>
                    <div className='brown-strategy-list'>
                        {STRATEGIES.map(strategy => {
                            const selected = selectedStrategies.includes(strategy.id);
                            return <div className='brown-strategy' key={strategy.id}>
                                <span className={'brown-strategy__icon brown-strategy__icon--' + strategy.tone}>{strategy.icon}</span>
                                <div className='brown-strategy__copy'><strong>{strategy.name}</strong><span>{strategy.detail}</span></div>
                                <button type='button' role='switch' aria-checked={selected} aria-label={'Select ' + strategy.name} className={'brown-switch' + (selected ? ' brown-switch--on' : '')} onClick={() => toggleStrategy(strategy.id)}><span /></button>
                            </div>;
                        })}
                    </div>
                    <div className='brown-strategy-note'>Selecting a strategy saves your workspace preference. It does not execute trades or activate automation.</div>
                    <button type='button' className='brown-primary-button' onClick={() => handleTabChange(1)}>Open Deriv Bot Builder <span>→</span></button>
                </section>
            </div>
        </main>
    );
});

export default AnalyzerDashboard;
