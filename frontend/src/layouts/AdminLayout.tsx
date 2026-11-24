import React from 'react'
import { DashboardLayout } from '../components/layout/dashboard'
import { PERMISSIONS } from '../utils/permissions'

export const AdminLayout: React.FC = () => {
  return (
    <DashboardLayout
      role="admin"
      requiredPermission={PERMISSIONS.ADMIN_ACCESS}
    />
  )
}
