const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/nsscp_db"
});

const createTablesQuery = `
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    province VARCHAR(100),
    district VARCHAR(100),
    facility_type VARCHAR(150),
    facility_name VARCHAR(255),
    contact_person VARCHAR(255),
    phone_number VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wanted_persons (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(50) UNIQUE NOT NULL,
    charge_details TEXT,
    issuing_province VARCHAR(100) NOT NULL,
    danger_level VARCHAR(50) DEFAULT 'عالي جداً',
    status VARCHAR(50) DEFAULT 'مطلوب حياً',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movement_reports (
    id SERIAL PRIMARY KEY,
    facility_id INT REFERENCES facilities(id),
    guest_name VARCHAR(255) NOT NULL,
    guest_identity VARCHAR(50) NOT NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_notifications (
    id SERIAL PRIMARY KEY,
    wanted_id INT REFERENCES wanted_persons(id),
    report_id INT REFERENCES movement_reports(id),
    detect_province VARCHAR(100) NOT NULL,
    detect_facility VARCHAR(255) NOT NULL,
    target_province VARCHAR(100) NOT NULL,
    alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const initDatabase = async () => {
    try {
        await pool.query(createTablesQuery);
        console.log('[DB INIT]: تم التحقق من وجود الجداول الأربعة وتهيئتها بنجاح.');
    } catch (err) {
        console.error('[DB INIT] خطأ أثناء تهيئة قاعدة البيانات:', err);
        process.exit(1);
    }
};

const startServer = async () => {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`[NSSCP SERVER]: المنظومة تعمل ومتصلة بنجاح على المنفذ العسكري: ${PORT}`);
    });
};

startServer();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار جلب جميع المنشآت الحية للـ Dashboard
app.get('/api/facilities', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM facilities ORDER BY registration_date DESC');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "خطأ في استدعاء السجلات الأمنية" });
    }
});

// مسار إدخال المنشآت وحفظها في قاعدة البيانات
app.post('/api/facilities', async (req, res) => {
    const { province, district, facilityType, facilityName, contactPerson, phone } = req.body;
    try {
        const queryText = 'INSERT INTO facilities(province, district, facility_type, facility_name, contact_person, phone_number) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [province, district, facilityType, facilityName, contactPerson, phone];
        await pool.query(queryText, values);
        
        res.status(201).json({
            success: true,
            message: "تم تقييد المنشأة وحفظها بنجاح في قاعدة البيانات الأمنية الموحدة"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "خطأ في قيد البيانات بالمنظومة" });
    }
});

// مسار جلب الإشعارات العاجلة من جدول system_notifications
app.get('/api/system-notifications', async (req, res) => {
    try {
        const queryText = `
            SELECT
                sn.*, 
                wp.full_name AS wanted_full_name,
                wp.identity_number AS wanted_identity_number,
                wp.charge_details,
                wp.issuing_province AS issuing_province
            FROM system_notifications sn
            LEFT JOIN wanted_persons wp ON sn.wanted_id = wp.id
            ORDER BY sn.alert_time DESC
        `;
        const result = await pool.query(queryText);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'فشل في جلب إشعارات العمليات الأمنية' });
    }
});

// مسار استقبال استمارات حركة النزلاء والمراجعين وفحصهم فوراً ضد قائمة المطلوبين
app.post('/api/movement-reports', async (req, res) => {
    const { facilityId, guestName, guestIdentity } = req.body;

    if (!facilityId || !guestName || !guestIdentity) {
        return res.status(400).json({ success: false, message: 'البيانات الأمنية للنموذج غير مكتملة.' });
    }

    try {
        const insertReport = await pool.query(
            'INSERT INTO movement_reports(facility_id, guest_name, guest_identity) VALUES($1, $2, $3) RETURNING *',
            [facilityId, guestName, guestIdentity]
        );
        const reportId = insertReport.rows[0].id;

        const checkWanted = await pool.query(
            "SELECT * FROM wanted_persons WHERE identity_number = $1 AND status = 'مطلوب حياً'",
            [guestIdentity]
        );

        if (checkWanted.rows.length > 0) {
            const wanted = checkWanted.rows[0];
            const facilityRes = await pool.query('SELECT * FROM facilities WHERE id = $1', [facilityId]);
            const facility = facilityRes.rows[0] || {};
            const detectProvince = facility.province || 'غير محدد';
            const detectFacility = facility.facility_name || 'منشأة غير محددة';

            await pool.query(
                'INSERT INTO system_notifications(wanted_id, report_id, detect_province, detect_facility, target_province) VALUES($1, $2, $3, $4, $5)',
                [wanted.id, reportId, detectProvince, detectFacility, wanted.issuing_province]
            );

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.status(200).json({
                alert: true,
                message: `⚠️ إشعار أحمر عملياتي عاجل! المطلوب أمنياً [ ${wanted.full_name} ] المعمم عنه من إدارة أمن [ ${wanted.issuing_province} ] متواجد الآن في محافظة [ ${detectProvince} ] داخل [ ${detectFacility} ]، القضية: ${wanted.charge_details || 'لم ترد تفاصيل القضية'}`,
                wantedDetails: wanted
            });
        }

        res.status(201).json({
            alert: false,
            message: 'تم تسجيل حركة النزيل أو المراجع بنجاح ولا يوجد تطابق مع قائمة المطلوبين أمنياً.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'خطأ في معالجة استمارة حركة النزلاء والمراجعين.' });
    }
});

