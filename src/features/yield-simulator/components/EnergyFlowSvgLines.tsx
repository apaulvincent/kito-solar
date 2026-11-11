import React from 'react';

interface EnergyFlowSvgLinesProps {
  solarActive: boolean;
  loadActive: boolean;
  battCharging: boolean;
  battDischarging: boolean;
  gridImporting: boolean;
  gridExporting: boolean;
  isGridOutage: boolean;
}

export const EnergyFlowSvgLines: React.FC<EnergyFlowSvgLinesProps> = ({
  solarActive,
  loadActive,
  battCharging,
  battDischarging,
  gridImporting,
  gridExporting,
  isGridOutage,
}) => {
  const branches: {
    basePath: string;
    active: boolean;
    activePath: string;
    stroke: string;
  }[] = [
    {
      basePath: 'M 155 80 L 300 160',
      active: solarActive,
      activePath: 'M 155 80 L 300 160',
      stroke: '#F59E0B',
    },
    {
      basePath: 'M 300 160 L 445 80',
      active: loadActive,
      activePath: 'M 300 160 L 445 80',
      stroke: '#06B6D4',
    },
    {
      basePath: 'M 300 160 L 155 245',
      active: battCharging || battDischarging,
      activePath: battCharging ? 'M 300 160 L 155 245' : 'M 155 245 L 300 160',
      stroke: '#10B981',
    },
    {
      basePath: 'M 300 160 L 445 245',
      active: (gridImporting || gridExporting) && !isGridOutage,
      activePath: gridExporting ? 'M 300 160 L 445 245' : 'M 445 245 L 300 160',
      stroke: gridExporting ? '#10B981' : '#38BDF8',
    },
  ];

  return (
    <svg
      viewBox="0 0 600 320"
      className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {branches.map((branch) => (
        <React.Fragment key={branch.basePath}>
          <path
            d={branch.basePath}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.07]"
            strokeWidth="3"
          />
          {branch.active && (
            <path
              d={branch.activePath}
              fill="none"
              stroke={branch.stroke}
              strokeWidth="3.5"
              strokeDasharray="8 8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="32"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
        </React.Fragment>
      ))}
    </svg>
  );
};
