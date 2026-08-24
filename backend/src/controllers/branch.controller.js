import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSms } from '../services/sms.service.js';

// Бүх салбарууд
export const getAllBranches = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        name,
        address,
        district,
        phone,
        opening_hours,
        latitude,
        longitude,
        is_active
      FROM branches
      WHERE is_active = true
      ORDER BY name`
    );

    res.json({
      success: true,
      data: result.rows.map(branch => ({
        id: branch.id,
        name: branch.name,
        address: branch.address,
        district: branch.district,
        phone: branch.phone,
        openingHours: branch.opening_hours,
        location: branch.latitude && branch.longitude ? {
          lat: parseFloat(branch.latitude),
          lng: parseFloat(branch.longitude)
        } : null
      }))
    });

  } catch (error) {
    next(error);
  }
};

// Түвшин тогтоох цаг захиалах хүсэлт ("ЦАГ ЗАХИАЛАХ ХҮСЭЛТ ИЛГЭЭХ" — нүүр хуудас)
export const createAssessmentRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      throw new AppError('Утасны дугаар заавал шаардлагатай', 400);
    }

    const branchResult = await pool.query(
      'SELECT id, name, phone FROM branches WHERE id = $1 AND is_active = true',
      [id]
    );

    if (branchResult.rows.length === 0) {
      throw new AppError('Салбар олдсонгүй', 404);
    }

    const branch = branchResult.rows[0];

    await sendSms({
      to: branch.phone,
      message: `Шинэ түвшин тогтоох хүсэлт: ${phone} дугаараас "${branch.name}" салбарт бүртгүүлэхийг хүссэн байна. Та холбогдоно уу.`,
    });

    const result = await pool.query(
      `INSERT INTO assessment_requests (branch_id, phone)
       VALUES ($1, $2)
       RETURNING id, created_at`,
      [id, phone]
    );

    res.status(201).json({
      success: true,
      message: `${branch.name} салбарын багш тантай удахгүй холбогдож, түвшин тогтоох цагийг тохирох болно`,
      data: { id: result.rows[0].id, createdAt: result.rows[0].created_at },
    });
  } catch (error) {
    next(error);
  }
};

// Нэг салбарын дэлгэрэнгүй
export const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const branchResult = await pool.query(
      `SELECT 
        id,
        name,
        address,
        district,
        phone,
        opening_hours,
        latitude,
        longitude,
        is_active,
        created_at
      FROM branches
      WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (branchResult.rows.length === 0) {
      throw new AppError('Салбар олдсонгүй', 404);
    }

    const branch = branchResult.rows[0];

    // Салбарын тасалгаанууд
    const roomsResult = await pool.query(
      `SELECT 
        id,
        room_number,
        capacity,
        floor
      FROM rooms
      WHERE branch_id = $1
      ORDER BY floor, room_number`,
      [id]
    );

    res.json({
      success: true,
      data: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        district: branch.district,
        phone: branch.phone,
        openingHours: branch.opening_hours,
        location: branch.latitude && branch.longitude ? {
          lat: parseFloat(branch.latitude),
          lng: parseFloat(branch.longitude)
        } : null,
        rooms: roomsResult.rows.map(room => ({
          id: room.id,
          roomNumber: room.room_number,
          capacity: room.capacity,
          floor: room.floor
        })),
        createdAt: branch.created_at
      }
    });

  } catch (error) {
    next(error);
  }
};
