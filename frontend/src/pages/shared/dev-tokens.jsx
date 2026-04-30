import React from 'react';

export default function DevTokens() {
  return (
    <div className="p-12 max-w-2xl mx-auto space-y-12">
      <h1 className="text-display-lg">Design System Tokens</h1>
      
      <div className="card space-y-6">
        <h2 className="text-h2">Component Test Card</h2>
        <p className="text-body-lg text-secondary">
          Testing the cosmic glow, typography, and component styling.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-label text-secondary block mb-2">Test Input</label>
            <input type="text" className="input" placeholder="Enter some data..." />
          </div>

          <div className="flex gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
          </div>

          <div className="flex gap-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="pill pill-success">Present</span>
            <span className="pill pill-danger">Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
