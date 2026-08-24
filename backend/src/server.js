import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import branchRoutes from './routes/branch.routes.js';
import studentRoutes from './routes/student.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import studyRoutes from './routes/study.routes.js';
import lessonRoutes from './routes/lesson.routes.js';

// Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'Server ажиллаж байна',
      database: 'Connected' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Өгөгдлийн сантай холбогдож чадсангүй',
      database: 'Disconnected' 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/study-inquiries', studyRoutes);
app.use('/api/lessons', lessonRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Server эхлүүлэх
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🎓 Пи тоо Backend Server            ║
║   🚀 Server: http://localhost:${PORT}   ║
║   📊 Environment: ${process.env.NODE_ENV || 'development'}        ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
