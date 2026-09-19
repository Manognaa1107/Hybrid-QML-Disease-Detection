import React from 'react';
import { HeartPulse, Activity, Stethoscope, ArrowRight } from 'lucide-react';

export default function NewScreeningPage({ onSelectDisease }) {
  const diseases = [
    {
      id: 'heart',
      name: 'Heart Disease Screening',
      description: 'Analyze cardiovascular parameters with classical feature selection and 4-qubit VQC.',
      icon: HeartPulse,
      badgeClass: 'heart-icon-badge'
    },
    {
      id: 'breast_cancer',
      name: 'Breast Cancer Screening',
      description: 'Evaluate cell feature measurements with standardized quantum encoding for risk classification.',
      icon: Activity,
      badgeClass: 'breast-icon-badge'
    },
    {
      id: 'lung_cancer',
      name: 'Lung Cancer Screening',
      description: 'Screen clinical symptoms and risk factors through variational quantum statevector sampling.',
      icon: Stethoscope,
      badgeClass: 'lung-icon-badge'
    }
  ];

  return (
    <div className="screening-selection-view">
      <div className="selection-header-banner">
        <h2>New Screening</h2>
        <p>Choose a disease module below to start entering clinical features for Quantum Machine Learning risk prediction.</p>
      </div>

      <div className="screening-cards-grid">
        {diseases.map((d) => {
          const IconComponent = d.icon;
          return (
            <div
              key={d.id}
              className="screening-card clickable-disease-card"
              onClick={() => onSelectDisease(d.id)}
            >
              <div className={`card-icon-badge ${d.badgeClass}`}>
                <IconComponent className="card-svg-icon" size={28} />
              </div>
              <h3 className="disease-title">{d.name}</h3>
              <p className="disease-sub">{d.description}</p>
              <div className="card-action-hint">
                Start Screening <ArrowRight size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
