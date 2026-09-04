import pool from '../config/database.js';

// GET /api/admin/stats — дээд мөрийн үзүүлэлтүүд
export const getStats = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students)                                        AS total_students,
        (SELECT COUNT(*) FROM teachers WHERE is_active)                        AS active_teachers,
        (SELECT COUNT(*) FROM attendance)                                      AS attendance_total,
        (SELECT COUNT(*) FROM attendance WHERE status = 'present')             AS attendance_present,
        (SELECT COALESCE(SUM(amount), 0) FROM enrollment_requests
           WHERE status = 'confirmed'
             AND date_trunc('month', created_at) = date_trunc('month', now())) AS month_revenue_requests,
        (SELECT COALESCE(SUM(amount), 0) FROM payments
           WHERE status = 'completed'
             AND date_trunc('month', COALESCE(paid_at, created_at)) = date_trunc('month', now())) AS month_revenue_payments
    `);

    const r = rows[0];
    const attendanceRate = Number(r.attendance_total) > 0
      ? Math.round((Number(r.attendance_present) / Number(r.attendance_total)) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents: Number(r.total_students),
        activeTeachers: Number(r.active_teachers),
        attendanceRate,
        monthlyRevenue: Number(r.month_revenue_requests) + Number(r.month_revenue_payments),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/attendance-week — 7 хоногийн ирц (Даваа..Ням)
export const getWeeklyAttendance = async (req, res, next) => {
  try {
    // ISODOW: 1=Даваа .. 7=Ням
    const { rows } = await pool.query(`
      SELECT EXTRACT(ISODOW FROM l.start_time)::int AS dow,
             COUNT(*) FILTER (WHERE a.status = 'present')  AS present,
             COUNT(*) FILTER (WHERE a.status <> 'present') AS absent
      FROM attendance a
      JOIN lessons l ON a.lesson_id = l.id
      GROUP BY 1
    `);

    const labels = ['Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям', 'Ням'];
    const map = new Map(rows.map((x) => [x.dow, x]));
    const data = labels.map((label, i) => {
      const row = map.get(i + 1);
      return {
        label,
        present: row ? Number(row.present) : 0,
        absent: row ? Number(row.absent) : 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/payment-status — төлбөрийн байдал (donut)
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM enrollment_requests
      GROUP BY status
    `);

    const by = Object.fromEntries(rows.map((r) => [r.status, r.count]));
    res.json({
      success: true,
      data: {
        paid: by.confirmed || 0,
        pending: by.pending || 0,
        refunded: by.cancelled || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/recent-students — сүүлийн бүртгэлүүд
export const getRecentStudents = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name,
        s.created_at,
        (SELECT TRIM(CONCAT(tu.first_name, ' ', tu.last_name))
           FROM lesson_enrollments le
           JOIN lessons l   ON le.lesson_id = l.id
           JOIN teachers t  ON l.teacher_id = t.id
           JOIN users tu    ON t.user_id = tu.id
          WHERE le.student_id = s.id
          ORDER BY l.start_time DESC LIMIT 1)         AS teacher,
        (SELECT b.name
           FROM lesson_enrollments le
           JOIN lessons l  ON le.lesson_id = l.id
           JOIN rooms r    ON l.room_id = r.id
           JOIN branches b ON r.branch_id = b.id
          WHERE le.student_id = s.id
          ORDER BY l.start_time DESC LIMIT 1)         AS branch,
        (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0))
           FROM attendance a WHERE a.student_id = s.id) AS attendance_rate
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name || '—',
        teacher: r.teacher || '—',
        branch: r.branch || '—',
        attendanceRate: r.attendance_rate === null ? null : Number(r.attendance_rate),
        status: 'Идэвхтэй',
      })),
    });
  } catch (error) {
    next(error);
  }
};
