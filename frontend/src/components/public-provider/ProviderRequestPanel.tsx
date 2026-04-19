import React from 'react';
import { useI18n } from '../../i18n';
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
  const { t } = useI18n();

  if (!visible) return null;

  return (
    <section className="psp-surface">
      <div className="psp-surface__header">
        <div>
          <h2>{t('Create a service request')}</h2>
          <div className="psp-surface__sub">
            {t('Share the brief, timing, and budget so the provider can reply faster.')}
          </div>
        </div>
        <button type="button" className="psp-button psp-button--secondary" onClick={onClose}>
          {t('Close')}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={requestForm.serviceId}
          onChange={(event) => onChange('serviceId', event.target.value)}
          className="psp-select"
        >
          <option value="">{t('No specific service selected')}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>

        <input
          value={requestForm.subject}
          onChange={(event) => onChange('subject', event.target.value)}
          placeholder={t('Short request subject')}
          className="psp-input"
        />

        <textarea
          value={requestForm.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder={t('Describe the work clearly.')}
          className="psp-textarea md:col-span-2"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={requestForm.budgetMin}
          onChange={(event) => onChange('budgetMin', event.target.value)}
          placeholder={t('Budget min')}
          className="psp-input"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={requestForm.budgetMax}
          onChange={(event) => onChange('budgetMax', event.target.value)}
          placeholder={t('Budget max')}
          className="psp-input"
        />

        <input
          value={requestForm.currencyCode}
          onChange={(event) => onChange('currencyCode', event.target.value)}
          placeholder={t('Currency')}
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
          placeholder={t('Optional opening message')}
          className="psp-textarea md:col-span-2"
        />
      </div>

      <div className="mt-4 rounded-[22px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
        {t(
          'Strong requests are easier to answer. Include the location, what should be delivered, and any deadline or budget constraints that matter.'
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="psp-button psp-button--primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? t('Sending request...') : t('Send request')}
        </button>
        <button type="button" className="psp-button psp-button--secondary" onClick={onClose}>
          {t('Cancel')}
        </button>
      </div>
    </section>
  );
};

export default ProviderRequestPanel;
