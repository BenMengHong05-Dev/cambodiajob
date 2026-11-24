import React from 'react'
import { DashboardLayout } from '../components/layout/dashboard'
import { PERMISSIONS } from '../utils/permissions'

export const EmployerLayout: React.FC = () => {
  return (
    <DashboardLayout
      role="employer"
      requiredPermission={PERMISSIONS.EMPLOYER_ACCESS}
    />
  )
}
