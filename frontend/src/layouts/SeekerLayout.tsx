import React from 'react'
import { DashboardLayout } from '../components/layout/dashboard'
import { PERMISSIONS } from '../utils/permissions'

export const SeekerLayout: React.FC = () => {
  return (
    <DashboardLayout
      role="job_seeker"
      requiredPermission={PERMISSIONS.SEEKER_ACCESS}
    />
  )
}
