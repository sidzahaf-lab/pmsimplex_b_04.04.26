// src/config/entityTableMap.js
/**
 * Maps document entity types to their corresponding metadata tables
 * This is the single source of truth for entity-table relationships
 */

export const ENTITY_TABLE_MAP = {
  // Schedules
  'schedule_baseline': 'schdl_baselines',
  'schedule_current': 'schdl_currents',

  // Reports périodiques
  'report': 'periodic_reports',
  'hse_report': 'periodic_reports',
  'procurement_report': 'periodic_reports',
  'financial_report': 'periodic_reports',
  'hr_report': 'periodic_reports',
  'construction_report': 'periodic_reports',
  'it_log': 'periodic_reports',
  'regulatory': 'periodic_reports',

  // Contrats et légal
  'contract': 'contracts_meta',
  'tender': 'contracts_meta',
  'legal': 'contracts_meta',

  // Financier
  'financial': 'financial_docs_meta',
  'invoice': 'financial_docs_meta',
  'boq': 'financial_docs_meta',

  // Dessins et modèles
  'drawing': 'drawings_meta',
  'model': 'drawings_meta',
  'asbuilt': 'drawings_meta',

  // Technique générique
  'technical': 'technical_docs_meta',
  'specification': 'technical_docs_meta',
  'engineering': 'technical_docs_meta',
  'calculation': 'technical_docs_meta',
  'study': 'technical_docs_meta',
  'survey': 'technical_docs_meta',
  'scope': 'technical_docs_meta',
  'datasheet': 'technical_docs_meta',
  'manual': 'technical_docs_meta',
  'commissioning': 'technical_docs_meta',
  'training': 'technical_docs_meta',
  'plan': 'technical_docs_meta',
  'management': 'technical_docs_meta',
  'index': 'technical_docs_meta',
  'schedule': 'technical_docs_meta',
  'material_takeoff': 'technical_docs_meta',

  // HSE
  'hse_plan': 'hse_docs_meta',
  'hse_procedure': 'hse_docs_meta',
  'risk_assessment': 'hse_docs_meta',
  'jsa': 'hse_docs_meta',
  'incident': 'hse_docs_meta',
  'permit': 'hse_docs_meta',
  'toolbox': 'hse_docs_meta',
  'license': 'hse_docs_meta',

  // Qualité
  'quality': 'quality_docs_meta',
  'inspection': 'quality_docs_meta',
  'test': 'quality_docs_meta',
  'audit': 'quality_docs_meta',
  'ncr': 'quality_docs_meta',
  'certificate': 'quality_docs_meta',
  'checklist': 'quality_docs_meta',
  'punch_list': 'quality_docs_meta',
  'welding': 'quality_docs_meta',

  // Procurement et logistique
  'procurement': 'procurement_docs_meta',
  'vendor': 'procurement_docs_meta',
  'logistics': 'procurement_docs_meta',

  // Construction
  'method_statement': 'construction_docs_meta',
  'work_order': 'construction_docs_meta',

  // Correspondance
  'correspondence': 'correspondence_meta',
  'meeting': 'correspondence_meta',
  'transmittal': 'correspondence_meta',
  'rfi': 'correspondence_meta',
  'tq': 'correspondence_meta',
  'presentation': 'correspondence_meta',
  'register': 'correspondence_meta',

  // RH
  'hr': 'hr_docs_meta',
  'hr_plan': 'hr_docs_meta',
  'insurance': 'hr_docs_meta',

  // IT
  'it': 'it_docs_meta'
};

/**
 * Reverse mapping - get entity type from table name
 * Useful for debugging and reverse lookups
 */
export const TABLE_TO_ENTITY_MAP = Object.entries(ENTITY_TABLE_MAP).reduce((acc, [entity, table]) => {
  if (!acc[table]) {
    acc[table] = [];
  }
  acc[table].push(entity);
  return acc;
}, {});

/**
 * Resolve entity type to table name
 * @param {string} entityType - The entity type from doc_types
 * @returns {string} The corresponding table name
 * @throws {Error} If entity type is unknown
 */
export function resolveEntityTable(entityType) {
  const table = ENTITY_TABLE_MAP[entityType];
  if (!table) {
    throw new Error(`Unknown entity_type: "${entityType}". Add to ENTITY_TABLE_MAP in config/entityTableMap.js`);
  }
  return table;
}

/**
 * Check if entity type is valid
 * @param {string} entityType - The entity type to check
 * @returns {boolean} True if valid
 */
export function isValidEntityType(entityType) {
  return entityType in ENTITY_TABLE_MAP;
}

/**
 * Get all entity types that map to a specific table
 * @param {string} tableName - The table name
 * @returns {string[]} Array of entity types
 */
export function getEntityTypesForTable(tableName) {
  return TABLE_TO_ENTITY_MAP[tableName] || [];
}

/**
 * Get all available entity types
 * @returns {string[]} Array of all entity types
 */
export function getAllEntityTypes() {
  return Object.keys(ENTITY_TABLE_MAP);
}

/**
 * Get all metadata tables
 * @returns {string[]} Array of all unique table names
 */
export function getAllMetadataTables() {
  return [...new Set(Object.values(ENTITY_TABLE_MAP))];
}

export default {
  ENTITY_TABLE_MAP,
  TABLE_TO_ENTITY_MAP,
  resolveEntityTable,
  isValidEntityType,
  getEntityTypesForTable,
  getAllEntityTypes,
  getAllMetadataTables
};