import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import './analyzer-dashboard.scss';

type AnalyzerDashboardProps = {
    handleTabChange: (active_number: number) => void;
};

const STRATEGIES = [
    { id: 'xrate', name: 'X Rate', detail: 'Matches / Differs analysis', tone: 'violet', icon: '◎' },
    { id: 'striker', name: 'Striker', detail: 'Accumulator contract setup', tone: 'green', icon: '↗' },
    { id: 'even-odd', name: 'Even and Odd', detail: 'Over / Under + Rise / Fall', tone: 'mint', icon: 'ϟ' },
    { id: 'higher-lower', name: 'Higher Lower', detail: 'Even / Odd + Matches / Differs', tone: 'teal', icon: '⇅' },
    { id: 'digit-ai', name: 'Digit AI', detail: 'Last-digit pattern analysis', tone: 'orange', icon: '✧' },
];

const MARKETS = [
    { label: 'Volatility 10 Index', value: 'R_10' },
    { label: 'Volatility 25 Index', value: 'R_25' },
    { label: 'Volatility 50 Index', value: 'R_50' },
    { label: 'Volatility 75 Index', value: 'R_75' },
    { label: 'Volatility 100 Index', value: 'R_100' },
    { label: 'Volatility 10 (1s) Index', value: '1HZ10V' },
    { label: 'Volatility 25 (1s) Index', value: '1HZ25V' },
    { label: 'Volatility 50 (1s) Index', value: '1HZ50V' },
    { label: 'Volatility 75 (1s) Index', value: '1HZ75V' },
    { label: 'Volatility 100 (1s) Index', value: '1HZ100V' },
    { label: 'Boom 500 Index', value: 'BOOM500' },
    { label: 'Boom 1000 Index', value: 'BOOM1000' },
    { label: 'Crash 500 Index', value: 'CRASH500' },
    { label: 'Crash 1000 Index', value: 'CRASH1000' },
];

const AnalyzerDashboard = observer(({ handleTabChange }: AnalyzerDashboardProps) => {
    const { client } = useStore();
    const [market, setMarket] = useState('R_100');
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
    const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');

    const accountType = client.is_logged_in ? (client.is_virtual ? 'Demo Account' : 'Live Account') : 'Not connected';
    const balance = useMemo(() => {
        const value = Number(client.balance);
        return Number.isFinite(value)
            ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
            : '—';
    }, [client.balance]);

    const toggleStrategy = (id: string) => {
        setSelectedStrategies(current =>
            current.includes(id) ? current.filter(item => item !== id) : [...current, id]
        );
    };

    return (
        <main className='brown-analyzer'>
            <div className='brown-analyzer__intro'>
                <div>
                    <div className='brown-analyzer__eyebrow'><span className='brown-analyzer__pulse' /> DERIV SYNTHETIC INDICES</div>
                    <h1>Trading Analyzer</h1>
                    <p>Analyze Deriv markets and manage your strategy workspace.</p>
                </div>
                <div className='brown-analyzer__market'>
                    <label htmlFor='deriv-market-select'>Market</label>
                    <select id='deriv-market-select' value={market} onChange={event => setMarket(event.target.value)}>
                        {MARKETS.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
                    </select>
                </div>
            </div>

            <div className='brown-analyzer__grid'>
                <section className='brown-panel brown-panel--account'>
                    <div className='brown-panel__heading'>
                        <h2><span className='brown-icon'>♙</span> Deriv Account</h2>
                        <span className={client.is_logged_in ? 'brown-status brown-status--connected' : 'brown-status'}>
                            <i /> {client.is_logged_in ? 'Connected' : 'Not connected'}
                        </span>
                    </div>
                    <div className='brown-account-type'>
                        <span>Account Type:</span>
                        <strong>{accountType}</strong>
                        {client.is_logged_in && <span className='brown-account-id'>{client.loginid}</span>}
                    </div>
                    <div className='brown-account-stats'>
                        <div className='brown-stat'>
                            <span>Balance</span>
                            <strong>{client.is_logged_in ? balance : '—'} <small>{client.is_logged_in ? client.currency : ''}</small></strong>
                        </div>
                        <div className='brown-stat'>
                            <span>Selected market</span>
                            <strong>{MARKETS.find(item => item.value === market)?.label ?? market}</strong>
                        </div>
                    </div>
                    <div className='brown-account-foot'>
                        <span>{client.is_logged_in ? 'Your Deriv account is linked to this session.' : 'Connect your Deriv account using the Log in button above.'}</span>
                        {!client.is_logged_in && <span className='brown-connect-hint'>Use the app header to log in securely.</span>}
                    </div>
                </section>

                <section className='brown-panel brown-panel--history'>
                    <div className='brown-panel__heading'>
                        <h2><span className='brown-icon'>♜</span> Trade History</h2>
                        <span className='brown-history-count'>Session activity</span>
                    </div>
                    <div className='brown-history-stats'>
                        <div className='brown-history-stat'>
                            <span>Net Profit/Loss</span>
                            <strong>—</strong>
                            <small>Awaiting trade records</small>
                        </div>
                        <div className='brown-history-stat'>
                            <span>Win Rate</span>
                            <strong>—</strong>
                            <small>Not calculated yet</small>
                        </div>
                    </div>
                    <div className='brown-history-tabs' role='tablist' aria-label='Trade history filter'>
                        {(['all', 'wins', 'losses'] as const).map(filter => (
                            <button
                                type='button'
                                role='tab'
                                aria-selected={historyFilter === filter}
                                className={historyFilter === filter ? 'is-active' : ''}
                                onClick={() => setHistoryFilter(filter)}
                                key={filter}
                            >
                                {filter === 'all' ? 'All Trades' : filter === 'wins' ? 'Wins' : 'Losses'} <b>0</b>
                            </button>
                        ))}
                    </div>
                    <div className='brown-empty-history'>
                        <div className='brown-empty-history__icon'>▥</div>
                        <strong>No trades recorded in this view</strong>
                        <span>Completed Deriv contracts will appear here when trade-history tracking is connected.</span>
                    </div>
                </section>

                <section className='brown-panel brown-panel--strategies'>
                    <div className='brown-panel__heading'>
                        <h2><span className='brown-icon'>▥</span> Trading Strategies</h2>
                        <span className='brown-selected-count'>{selectedStrategies.length} selected</span>
                    </div>
                    <div className='brown-strategy-list'>
                        {STRATEGIES.map(strategy => {
                            const selected = selectedStrategies.includes(strategy.id);
                            return (
                                <div className='brown-strategy' key={strategy.id}>
                                    <span className={'brown-strategy__icon brown-strategy__icon--' + strategy.tone}>{strategy.icon}</span>
                                    <div className='brown-strategy__copy'>
                                        <strong>{strategy.name}</strong>
                                        <span>{strategy.detail}</span>
                                    </div>
                                    <button
                                        type='button'
                                        role='switch'
                                        aria-checked={selected}
                                        aria-label={'Select ' + strategy.name}
                                        className={'brown-switch' + (selected ? ' brown-switch--on' : '')}
                                        onClick={() => toggleStrategy(strategy.id)}
                                    ><span /></button>
                                </div>
                            );
                        })}
                    </div>
                    <div className='brown-strategy-note'>
                        Strategy switches currently save your selections only. They do not place trades or start automation.
                    </div>
                    <button type='button' className='brown-primary-button' onClick={() => handleTabChange(1)}>
                        Open Deriv Bot Builder <span>→</span>
                    </button>
                </section>
            </div>
        </main>
    );
});

export default AnalyzerDashboard;
