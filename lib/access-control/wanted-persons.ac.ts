export const wantedPersonsAccessControl = {
  create: {
    roles: ['INVESTIGATOR', 'SUPERVISOR', 'ADMIN'],
    attributes: ['department', 'cleared'],
  },
  read: {
    roles: ['VIEWER', 'INVESTIGATOR', 'SUPERVISOR', 'ADMIN'],
    attributes: ['department', 'public'],
  },
  update: {
    roles: ['INVESTIGATOR', 'SUPERVISOR', 'ADMIN'],
    attributes: ['owner', 'department', 'approved'],
  },
  delete: {
    roles: ['SUPERVISOR', 'ADMIN'],
    attributes: ['owner', 'archived'],
  },
  publish: {
    roles: ['SUPERVISOR', 'ADMIN'],
    attributes: ['approved', 'department'],
  },
  capture: {
    roles: ['OFFICER', 'INVESTIGATOR', 'SUPERVISOR', 'ADMIN'],
    attributes: ['published', 'active'],
  },
  internationalNotice: {
    roles: ['SUPERVISOR', 'ADMIN', 'INTERPOL_OFFICER'],
    attributes: ['critical', 'approved'],
  },
}

export const wantedPersonsAbacPolicies = {
  canCreateWantedPerson: (user: any) =>
    ['INVESTIGATOR', 'SUPERVISOR', 'ADMIN'].includes(user.role) &&
    user.department?.cleared === true,

  canPublishNotice: (user: any) =>
    ['SUPERVISOR', 'ADMIN'].includes(user.role) &&
    user.department?.hasInterpolAccess === true,

  canRecordCapture: (user: any) =>
    ['OFFICER', 'INVESTIGATOR', 'SUPERVISOR', 'ADMIN'].includes(user.role) &&
    user.department?.operationalClearance === true,

  canViewFullDetails: (user: any, resource: any) =>
    user.department?.id === resource.departmentId ||
    ['SUPERVISOR', 'ADMIN'].includes(user.role) ||
    (user.role === 'VIEWER' && resource.public === true),
}
