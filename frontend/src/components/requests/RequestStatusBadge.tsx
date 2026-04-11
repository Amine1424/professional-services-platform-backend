import React from 'react';
import { getRequestStatusMeta } from '../../lib/service-request';

interface RequestStatusBadgeProps {
  status?: string | null;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ status }) => {
  const meta = getRequestStatusMeta(status);

  return (
    <span className={`psp-request-status psp-request-status--${meta.tone}`}>
      {meta.label}
    </span>
  );
};

export default RequestStatusBadge;
