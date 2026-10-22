import type { Employee } from '../../shared/api/types';
import { getDb } from '../../shared/offline/db';
import { escapeLike, normalizeForSearch } from '../../shared/utils/text';

interface DirectoryRow {
  id: string;
  display_name: string;
  job_title: string | null;
  department_name: string | null;
  location_name: string | null;
  email: string;
  phone_office: string | null;
  phone_mobile: string | null;
  manager_id: string | null;
  manager_name: string | null;
}

function toEmployee(row: DirectoryRow): Employee {
  return {
    id: row.id,
    displayName: row.display_name,
    jobTitle: row.job_title,
    departmentName: row.department_name,
    locationName: row.location_name,
    email: row.email,
    phoneOffice: row.phone_office,
    phoneMobile: row.phone_mobile,
    managerId: row.manager_id,
    managerName: row.manager_name,
  };
}

const COLUMNS =
  'id, display_name, job_title, department_name, location_name, email, phone_office, phone_mobile, manager_id, manager_name';

/** Suche in der lokalen Kopie. Alle Suchbegriffe müssen vorkommen, Akzente und ß werden ignoriert. */
export async function searchLocalDirectory(query: string, limit = 50): Promise<Employee[]> {
  const db = await getDb();
  const tokens = normalizeForSearch(query).split(/\s+/).filter(Boolean);

  const where = tokens.map(() => "search_text LIKE ? ESCAPE '\\'").join(' AND ');
  const params = tokens.map((token) => `%${escapeLike(token)}%`);

  const rows = await db.getAllAsync<DirectoryRow>(
    `SELECT ${COLUMNS} FROM directory ${where ? `WHERE ${where}` : ''} ORDER BY display_name COLLATE NOCASE LIMIT ?`,
    [...params, limit],
  );
  return rows.map(toEmployee);
}

export async function getLocalEmployee(id: string): Promise<Employee | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DirectoryRow>(`SELECT ${COLUMNS} FROM directory WHERE id = ?`, [id]);
  return row ? toEmployee(row) : null;
}
