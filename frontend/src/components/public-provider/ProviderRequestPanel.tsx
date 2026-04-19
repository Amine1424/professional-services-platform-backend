import React from 'react';
import { PublicProviderPayload } from './types';

interface ProviderRequestForm {
  serviceId: string;
  subject: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  currencyCode: string;
  preferredDate: string;
  initialMessage: string;
}

interface ProviderRequestPanelProps {
  visible: boolean;
  services: PublicProviderPayload['services'];
  requestForm: ProviderRequestForm;
  submitting: boolean;
  onClose: () => void;
  onChange: (field: keyof ProviderRequestForm, value: string) => void;
  onSubmit: () => void;
}

const ProviderRequestPanel: React.FC<ProviderRequestPanelProps> = ({
  visible,
  services,
  requestForm,
  submitting,
  onClose,
  onChange,
  onSubmit,
}) => {
  if (!visible) return null;

  return (
    <section className="psp-surface">
      <div className="psp-surface__header">
        <div>
          <h2>Create a service request</h2>
          <div className="psp-surface__sub">
            Share the brief, timing, and budget so the provider can reply faster.
          </div>
        </div>
        <button type="button" className="psp-button psp-button--secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={requestForm.serviceId}
          onChange={(event) => onChange('serviceId', event.target.value)}
          className="psp-select"
        >
          <option value="">No specific service selected</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>

        <input
          value={requestForm.subject}
          onChange={(event) => onChange('subject', event.target.value)}
          placeholder="Short request subject"
          className="psp-input"
        />

        <textarea
          value={requestForm.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Describe the work clearly."
          className="psp-textarea md:col-span-2"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={requestForm.budgetMin}
          onChange={(event) => onChange('budgetMin', event.target.value)}
          placeholder="Budget min"
          className="psp-input"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={requestForm.budgetMax}
          onChange={(event) => onChange('budgetMax', event.target.value)}
          placeholder="Budget max"
          className="psp-input"
        />

        <input
          value={requestForm.currencyCode}
          onChange={(event) => onChange('currencyCode', event.target.value)}
          placeholder="Currency"
          className="psp-input"
        />

        <input
          type="datetime-local"
          value={requestForm.preferredDate}
          onChange={(event) => onChange('preferredDate', event.target.value)}
          className="psp-input"
        />

        <textarea
          value={requestForm.initialMessage}
          onChange={(event) => onChange('initialMessage', event.target.value)}
          placeholder="Optional opening message"
          className="psp-textarea md:col-span-2"
        />
      </div>

      <div className="mt-4 rounded-[22px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
        Strong requests are easier to answer. Include the location, what should be delivered, and any deadline or budget constraints that matter.
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="psp-button psp-button--primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? 'Sending request...' : 'Send request'}
        </button>
        <button type="button" className="psp-button psp-button--secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </section>
  );
};

export default ProviderRequestPanel;
