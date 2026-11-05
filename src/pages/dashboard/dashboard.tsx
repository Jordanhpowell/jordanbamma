import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import OnboardTourHandler from '../tutorials/dbot-tours/onboarding-tour';
import Announcements from './announcements';
import Cards from './cards';
import InfoPanel from './info-panel';

type TMobileIconGuide = {
    handleTabChange: (active_number: number) => void;
};

const DashboardComponent = observer(({ handleTabChange }: TMobileIconGuide) => {
    const { load_modal, dashboard, client, google_drive } = useStore();
    const { dashboard_strategies } = load_modal;
    const { is_google_drive_configured } = google_drive;
    const { active_tab, active_tour } = dashboard;
    const has_dashboard_strategies = !!dashboard_strategies?.length;
    const { isDesktop, isTablet } = useDevice();

    const strategies = [
        {
            title: 'Digit Differs',
            description: 'High win-rate strategy. Wins if the last digit is not the one you pick (≈90%).',
        },
        {
            title: 'Digit Matches',
            description: 'High payout strategy. Wins if the last digit matches the one you pick (≈10%).',
        },
        {
            title: 'Dual Rise / Fall',
            description: 'Places both CALL and PUT at the same time. One side almost always wins.',
        },
        {
            title: 'Even / Odd',
            description: 'Simple 50/50 digit strategy with solid money management options.',
        },
        {
            title: 'Over / Under',
            description: 'Predict if the last digit is over or under a barrier you choose.',
        },
    ];

    return (
        <React.Fragment>
            <div
                className={classNames('tab__dashboard', {
                    'tab__dashboard--tour-active': active_tour,
                })}
            >
                <div className='tab__dashboard__content'>
                    {client.is_logged_in && (
                        <Announcements is_mobile={!isDesktop} is_tablet={isTablet} handleTabChange={handleTabChange} />
                    )}

                    {/* STRATEGY CARDS */}
                    <div style={{ padding: '32px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                        <h1 style={{ textAlign: 'center', color: '#ffffff', fontSize: '32px', marginBottom: '8px' }}>
                            AI Strategies
                        </h1>
                        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '32px' }}>
                            All strategies unlocked. Pick one and start trading.
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '16px',
                            }}
                        >
                            {strategies.map((s) => (
                                <div
                                    key={s.title}
                                    onClick={() => handleTabChange(1)}
                                    style={{
                                        background: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <h3 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '18px' }}>{s.title}</h3>
                                    <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>{s.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='quick-panel'>
                        <div
                            className={classNames('tab__dashboard__header', {
                                'tab__dashboard__header--listed': isDesktop && has_dashboard_strategies,
                            })}
                        >
                            {!has_dashboard_strategies && (
                                <Text
                                    className='title'
                                    as='h2'
                                    color='prominent'
                                    size={isDesktop ? 'sm' : 's'}
                                    lineHeight='xxl'
                                    weight='bold'
                                >
                                    {localize('Load or build your bot')}
                                </Text>
                            )}
                            <Text
                                as='p'
                                color='prominent'
                                lineHeight='s'
                                size={isDesktop ? 's' : 'xxs'}
                                className={classNames('subtitle', { 'subtitle__has-list': has_dashboard_strategies })}
                            >
                                {is_google_drive_configured
                                    ? localize(
                                          'Import a bot from your computer or Google Drive, build it from scratch, or start with a quick strategy.'
                                      )
                                    : localize(
                                          'Import a bot from your computer, build it from scratch, or start with a quick strategy.'
                                      )}
                            </Text>
                        </div>
                        <Cards has_dashboard_strategies={has_dashboard_strategies} is_mobile={!isDesktop} />
                    </div>
                </div>
            </div>
            <InfoPanel />
            {active_tab === 0 && <OnboardTourHandler is_mobile={!isDesktop} />}
        </React.Fragment>
    );
});

export default DashboardComponent;
