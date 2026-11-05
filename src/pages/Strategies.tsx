import React from 'react';
import { useHistory } from 'react-router-dom';

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

const Strategies = () => {
  const history = useHistory();

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#ffffff', fontSize: '36px', marginBottom: '8px' }}>
        AI Strategies
      </h1>
      <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '40px' }}>
        All strategies unlocked. Pick one and start trading.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {strategies.map((s) => (
          <div
            key={s.title}
            onClick={() => history.push('/bot')}
            style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
            }}
          >
            <h3 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '20px' }}>{s.title}</h3>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Strategies;
