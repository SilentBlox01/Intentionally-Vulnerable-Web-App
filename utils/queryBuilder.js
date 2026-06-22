/**
 * Query builder utilities for dynamic SQL construction.
 * Used to reduce duplicated WHERE clause logic across route files.
 */

/**
 * Build a WHERE clause from an array of conditions.
 * @param {Array<{column: string, operator: string, value: any}>} conditions
 * @returns {{ whereClause: string, params: Array }}
 */
function buildWhereClause(conditions) {
  const params = [];
  const clauses = [];

  for (const cond of conditions) {
    if (cond.value !== undefined && cond.value !== null && cond.value !== '') {
      clauses.push(`${cond.column} ${cond.operator} ?`);
      params.push(cond.value);
    }
  }

  const whereClause = clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
  return { whereClause, params };
}

/**
 * Helper to create a condition object.
 * @param {string} column
 * @param {any} value
 * @param {string} operator
 */
function condition(column, value, operator = '=') {
  return { column, value, operator };
}

module.exports = { buildWhereClause, condition };
