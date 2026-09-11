import React from 'react';
import type { PulseInfo, DayActivity } from '../types';

interface ActivityPulseVisualizerProps {
  pulse: PulseInfo;
  recentDaysActivity: DayActivity[];
  contributors: string[];
}

export const ActivityPulseVisualizer: React.FC<ActivityPulseVisualizerProps> = ({
  pulse,
  recentDaysActivity,
  contributors,
}) => {
  const signalColor =
    pulse.level === 'high'
      ? 'var(--signal-high)'
      : pulse.level === 'medium'
      ? 'var(--signal-medium)'
      : pulse.level === 'low'
      ? 'var(--signal-low)'
      : 'var(--signal-dormant)';

  // Procedural Oscilloscope / Seismic Harmonic Wave across the observatory stage
  const wavePoints: [number, number][] = [];
  const svgWidth = 420;
  const svgHeight = 180;
  const centerY = svgHeight / 2;
  const steps = 60;

  // Wave dynamics modulated by real timestamp metrics
  const amp = pulse.level === 'dormant' ? 2 : Math.min(48, 8 + (pulse.score / 100) * 40);
  const freq = pulse.level === 'dormant' ? 0.04 : 0.08 + (pulse.updates24h * 0.04);
  const harmonic = pulse.level === 'high' ? 2.5 : 1.2;

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * svgWidth;
    const progress = i / steps;
    // Window bell curve
    const envelope = Math.sin(progress * Math.PI);
    const mainWave = Math.sin(i * freq * 4);
    const subWave = Math.cos(i * freq * harmonic * 3) * 0.4;
    const y = centerY + (mainWave + subWave) * amp * envelope;
    wavePoints.push([x, y]);
  }

  const wavePath = wavePoints.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  // Secondary echo wave for visual depth
  const echoPath = wavePoints.reduce((acc, [x, y], idx) => {
    const echoY = centerY + (y - centerY) * 0.45;
    return idx === 0 ? `M ${x.toFixed(1)} ${echoY.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${echoY.toFixed(1)}`;
  }, '');

  const maxDailyCount = Math.max(1, ...recentDaysActivity.map((d) => d.count));

  return (
    <div className="instrument-card">
      <div className="instrument-card-header">
        <span className="instrument-card-title">
          <span>●</span>
          <span>OBSERVATORY SIGNAL INSTRUMENT</span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          VECTOR: OSCILLATION_DIAL
        </span>
      </div>

      {/* Primary SVG Signal Stage: Dial + Waveform */}
      <div className="signal-stage">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          aria-label="Activity pulse waveform diagram"
        >
          {/* Orbital Calibration Circles */}
          <circle
            cx={svgWidth / 2}
            cy={centerY}
            r="80"
            fill="none"
            stroke="rgba(237, 234, 226, 0.06)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle
            cx={svgWidth / 2}
            cy={centerY}
            r="55"
            fill="none"
            stroke="rgba(237, 234, 226, 0.08)"
            strokeWidth="1"
          />
          <circle
            cx={svgWidth / 2}
            cy={centerY}
            r="28"
            fill="none"
            stroke="rgba(237, 234, 226, 0.12)"
            strokeWidth="1"
            strokeDasharray="1 3"
          />

          {/* Coordinate Crosshairs */}
          <line
            x1={svgWidth / 2}
            y1={10}
            x2={svgWidth / 2}
            y2={svgHeight - 10}
            stroke="rgba(237, 234, 226, 0.07)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <line
            x1={20}
            y1={centerY}
            x2={svgWidth - 20}
            y2={centerY}
            stroke="rgba(237, 234, 226, 0.07)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Radial Angle Measurement Ticks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = svgWidth / 2 + Math.cos(rad) * 76;
            const y1 = centerY + Math.sin(rad) * 76;
            const x2 = svgWidth / 2 + Math.cos(rad) * 84;
            const y2 = centerY + Math.sin(rad) * 84;
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(237, 234, 226, 0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Center Crosshair Target */}
          <line
            x1={svgWidth / 2 - 6}
            y1={centerY}
            x2={svgWidth / 2 + 6}
            y2={centerY}
            stroke={signalColor}
            strokeWidth="1.5"
          />
          <line
            x1={svgWidth / 2}
            y1={centerY - 6}
            x2={svgWidth / 2}
            y2={centerY + 6}
            stroke={signalColor}
            strokeWidth="1.5"
          />

          {/* Echo Waveform */}
          <path
            d={echoPath}
            fill="none"
            stroke={signalColor}
            strokeWidth="1"
            opacity="0.3"
            strokeDasharray="4 2"
          />

          {/* Main Oscilloscope Waveform */}
          <path
            d={wavePath}
            fill="none"
            stroke={signalColor}
            strokeWidth={pulse.level === 'high' ? 2 : 1.5}
          />

          {/* Active Data Marker Nodes on Waveform */}
          {pulse.level !== 'dormant' && (
            <>
              <circle
                cx={svgWidth * 0.42}
                cy={centerY - amp * 0.7}
                r="3"
                fill={signalColor}
              />
              <circle
                cx={svgWidth * 0.58}
                cy={centerY + amp * 0.6}
                r="2.5"
                fill={signalColor}
              />
            </>
          )}
        </svg>

        <div className="signal-stage-meta">
          <div>
            <span style={{ color: signalColor, fontWeight: 700 }}>
              {pulse.label.toUpperCase()}
            </span>
            <span style={{ margin: '0 8px', color: 'var(--border-strong)' }}>//</span>
            <span>{pulse.score}% VELOCITY INDEX</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            &ldquo;{pulse.description}&rdquo;
          </span>
        </div>

        <div className="signal-stage-windows">
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{pulse.updates24h}</strong> IN LAST 24H
          </span>
          <span>•</span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{pulse.updates3d}</strong> IN LAST 3D
          </span>
          <span>•</span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{pulse.updates7d}</strong> IN LAST 7D
          </span>
        </div>
      </div>

      {/* Supporting 1: Analog Velocity Calibration Strip (7-day histogram) */}
      <div className="analog-calibration">
        <div className="calibration-label-row">
          <span>7-DAY DENSITY CALIBRATION</span>
          <span>{pulse.updates7d} TOTAL DISPATCHES</span>
        </div>

        <div className="analog-pins-row">
          {recentDaysActivity.map((day, idx) => {
            const heightPercent = day.count === 0 ? 10 : Math.max(25, (day.count / maxDailyCount) * 100);
            const hasActivity = day.count > 0;

            return (
              <div key={idx} className="analog-pin-col">
                <div className="analog-pin-line-wrap">
                  <div
                    className={`analog-pin-needle ${hasActivity ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: hasActivity ? signalColor : 'var(--border-card)',
                    }}
                    title={`${day.dayLabel}: ${day.count} updates`}
                  />
                </div>
                <span className={`analog-pin-date ${day.isToday ? 'today-stamp' : ''}`}>
                  {day.dayLabel.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supporting 2: Recognized Crew Members */}
      <div className="operator-rack-wrap">
        <div className="operator-rack-title">
          RECOGNIZED CONTRIBUTORS ({contributors.length})
        </div>
        <div className="operator-bracket-rack">
          {contributors.map((c) => (
            <span key={c} className="operator-chip">
              [ {c} ]
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
