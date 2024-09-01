const userRoles = ['auditor', 'sm', 'admin', 'viewer'];

const regions = [
  'WR-North',
  'WR-South',
  'CR-East',
  'CR-South',
  'CR-North',
  'Southern',
  'ER-North',
  'ER-South',
];

const issueType = [
  'Customer Experience',
  'Housekeeping',
  'Customer Mistreatment',
  'Initiative',
  'Admin Issues',
  'Maintenance Issues',
  'IT Issues',
  'Inventory Issues',
  'Violation',
  'Safety',
  'Others',
];

const issueStatus = ['Pending', 'Resolved', 'Maintenance'];

module.exports = { userRoles, regions, issueStatus, issueType };
