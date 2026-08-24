import pool from '../config/database.js';

// Одоо байгаа 5 багшийг 4 салбарт хуваарилах нэг удаагийн скрипт
const assignments = [
  [1, 1], // Баясгалан -> УБ Төв
  [2, 2], // Амирлангуй -> Хан-Уул
  [3, 3], // Энхбилэг -> Баянзүрх
  [4, 1], // Оюунгэрэл -> УБ Төв
  [5, 4], // Энхтуяа -> Сүхбаатар
];

async function run() {
  try {
    for (const [teacherId, branchId] of assignments) {
      await pool.query('UPDATE teachers SET branch_id = $1 WHERE id = $2', [branchId, teacherId]);
    }
    const result = await pool.query(`
      SELECT t.id, u.first_name, b.name AS branch
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN branches b ON t.branch_id = b.id
      ORDER BY t.id
    `);
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Алдаа:', error);
    process.exit(1);
  }
}

run();
