const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { addMinutes, format, parse, startOfDay, endOfDay, isBefore, isAfter, isEqual, isSameDay } = require('date-fns');
const nodemailer = require('nodemailer');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DEFAULT_USER_ID = 1;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.warn("❌ SMTP Connection Error: Check your SendGrid API Key and Sender Email.");
        console.error(error);
    } else {
        console.log("🚀 SMTP Server is ready to send emails");
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"MeetFlow" <${process.env.FROM_EMAIL}>`,
            to,
            subject,
            html,
        });
    } catch (err) {
        console.error("Email send failed:", err);
    }
};

app.post('/event-types', async (req, res) => {
  const { title, description, slug, duration, bufferTime, scheduleId, questions } = req.body;
  try {
    const eventType = await prisma.eventType.create({
      data: {
        title,
        description,
        slug,
        duration: parseInt(duration),
        bufferTime: parseInt(bufferTime || 0),
        scheduleId: scheduleId ? parseInt(scheduleId) : null,
        userId: DEFAULT_USER_ID,
        questions: questions || []
      },
    });
    res.json(eventType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/event-types', async (req, res) => {
  const eventTypes = await prisma.eventType.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { schedule: true }
  });
  res.json(eventTypes);
});

app.get('/event-types/:slug', async (req, res) => {
  const { slug } = req.params;
  const eventType = await prisma.eventType.findUnique({
    where: { slug },
    include: { schedule: { include: { availability: true } } }
  });
  if (!eventType) return res.status(404).json({ error: 'Event type not found' });
  res.json(eventType);
});

app.get('/availability', async (req, res) => {
    let schedule = await prisma.schedule.findFirst({
        where: { userId: DEFAULT_USER_ID, isDefault: true },
        include: { availability: true }
    });

    if (!schedule) {
        schedule = await prisma.schedule.create({
            data: {
                name: 'Default Schedule',
                isDefault: true,
                userId: DEFAULT_USER_ID,
                availability: {
                    create: [
                        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
                        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
                    ]
                }
            },
            include: { availability: true }
        });
    }
    res.json({ id: schedule.id, availability: schedule.availability, timezone: schedule.timezone });
});

app.post('/availability', async (req, res) => {
    const { schedule: newSchedule } = req.body;
    try {
        const defaultSchedule = await prisma.schedule.findFirst({
            where: { userId: DEFAULT_USER_ID, isDefault: true }
        });
        
        if (defaultSchedule) {
            await prisma.availability.deleteMany({ where: { scheduleId: defaultSchedule.id } });
            await prisma.schedule.update({
                where: { id: defaultSchedule.id },
                data: {
                    availability: {
                        create: newSchedule.filter(s => s.active).map(s => ({
                            dayOfWeek: s.dayOfWeek,
                            startTime: s.startTime,
                            endTime: s.endTime
                        }))
                    }
                }
            });
        }
        res.json({ message: 'Default schedule updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/schedules', async (req, res) => {
    try {
        const schedules = await prisma.schedule.findMany({
            where: { userId: DEFAULT_USER_ID },
            include: { availability: true }
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message, name: error.name, code: error.code });
    }
});

app.post('/schedules', async (req, res) => {
    const { name, availability, id, timezone } = req.body; 
    try {
        if (id) {
            const scheduleId = parseInt(id);

            await prisma.availability.deleteMany({ where: { scheduleId } });
            const updated = await prisma.schedule.update({
                where: { id: scheduleId },
                data: {
                    name,
                    timezone: timezone || 'Asia/Kolkata',
                    availability: { 
                        create: availability.map(a => ({
                            dayOfWeek: a.dayOfWeek,
                            startTime: a.startTime,
                            endTime: a.endTime
                        }))
                    }
                }
            });
            return res.json(updated);
        } else {

            const created = await prisma.schedule.create({
                data: {
                    name,
                    timezone: timezone || 'Asia/Kolkata',
                    userId: DEFAULT_USER_ID,
                    availability: { 
                        create: availability.map(a => ({
                            dayOfWeek: a.dayOfWeek,
                            startTime: a.startTime,
                            endTime: a.endTime
                        }))
                    }
                }
            });
            return res.json(created);
        }
    } catch (error) {
        console.error("Save error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/schedules/:id', async (req, res) => {
    try {
        await prisma.schedule.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/overrides', async (req, res) => {
    const { scheduleId } = req.query;
    const overrides = await prisma.dateOverride.findMany({
        where: { 
            userId: DEFAULT_USER_ID,
            scheduleId: scheduleId ? parseInt(scheduleId) : undefined
        }
    });
    res.json(overrides);
});

app.post('/overrides', async (req, res) => {
    const { date, startTime, endTime, scheduleId } = req.body;
    try {
        const override = await prisma.dateOverride.create({
            data: {
                date: new Date(date),
                startTime,
                endTime,
                userId: DEFAULT_USER_ID,
                scheduleId: parseInt(scheduleId)
            }
        });
        res.json(override);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/overrides/:id', async (req, res) => {
    const { date, startTime, endTime } = req.body;
    try {
        const updated = await prisma.dateOverride.update({
            where: { id: parseInt(req.params.id) },
            data: {
                date: new Date(date),
                startTime,
                endTime
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/overrides/:id', async (req, res) => {
    try {
        await prisma.dateOverride.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Override deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/slots', async (req, res) => {
  const { eventTypeId, date } = req.query; // date format: YYYY-MM-DD
  if (!eventTypeId || !date) return res.status(400).json({ error: 'Missing params' });

  const evType = await prisma.eventType.findUnique({ 
      where: { id: parseInt(eventTypeId) },
      include: { schedule: { include: { availability: true } } }
  });
  if (!evType) return res.status(404).json({ error: 'Event type not found' });

  const targetDate = parse(date, 'yyyy-MM-dd', new Date());
  const now = new Date();
  const isToday = isSameDay(targetDate, now);
  const dayOfWeek = targetDate.getDay();

  const scheduleId = evType.scheduleId || (await prisma.schedule.findFirst({ where: { userId: DEFAULT_USER_ID, isDefault: true } })).id;

  const override = await prisma.dateOverride.findFirst({
      where: { 
          scheduleId: scheduleId,
          date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) } 
      }
  });

  let activeAvailability = null;

  if (override) {
      if (override.startTime && override.endTime) {
          activeAvailability = { startTime: override.startTime, endTime: override.endTime };
      } else {
          return res.json([]); // Blocked day
      }
  } else {

      const schedule = evType.schedule || await prisma.schedule.findFirst({ where: { userId: DEFAULT_USER_ID, isDefault: true }, include: { availability: true } });
      if (!schedule) return res.json([]);
      activeAvailability = schedule.availability.find(a => a.dayOfWeek === dayOfWeek);
  }

  if (!activeAvailability) return res.json([]);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
      status: 'confirmed'
    },
  });

  const slots = [];
  let currentPos = parse(activeAvailability.startTime, 'HH:mm', targetDate);
  const endPos = parse(activeAvailability.endTime, 'HH:mm', targetDate);

  const duration = evType.duration;
  const buffer = evType.bufferTime || 0;

  while (isBefore(currentPos, endPos)) {
    const slotStart = format(currentPos, 'HH:mm');
    const slotEndPos = addMinutes(currentPos, duration);
    const slotEnd = format(slotEndPos, 'HH:mm');

    if (isAfter(slotEndPos, endPos)) break;

    if (isToday && isBefore(currentPos, now)) {
        currentPos = addMinutes(slotEndPos, buffer);
        continue;
    }

    const overlap = bookings.some(b => {
        const bStart = parse(b.startTime, 'HH:mm', targetDate);
        const bEnd = parse(b.endTime, 'HH:mm', targetDate);
        const sStart = currentPos;
        const sEnd = slotEndPos;

        const paddedSStart = addMinutes(sStart, -buffer);
        const paddedSEnd = addMinutes(sEnd, buffer);
        
        return (isBefore(sStart, bEnd) && isAfter(slotEndPos, bStart));
    });

    if (!overlap) {
      slots.push({ start: slotStart, end: slotEnd });
    }

    currentPos = addMinutes(slotEndPos, buffer);
  }

  res.json(slots);
});

app.post('/book', async (req, res) => {
  const { eventTypeId, name, email, date, startTime, endTime, answers } = req.body;
  
  try {
    const targetDate = new Date(date);
    const booking = await prisma.booking.create({
      data: {
        eventTypeId: parseInt(eventTypeId),
        name,
        email,
        date: targetDate,
        startTime,
        endTime,
        answers: answers || {},
      },
      include: { eventType: true }
    });

    const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
            <h2 style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px;">Meeting Confirmed</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${name}, your meeting has been successfully scheduled.</p>
            
            <div style="background: #f9f9f9; padding: 25px; border-radius: 15px; margin: 30px 0;">
                <div style="margin-bottom: 15px;">
                    <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #aaa; letter-spacing: 1px; margin-bottom: 5px;">What</p>
                    <p style="font-weight: bold; font-size: 16px; margin: 0;">${booking.eventType.title}</p>
                </div>
                <div>
                    <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #aaa; letter-spacing: 1px; margin-bottom: 5px;">When</p>
                    <p style="font-weight: bold; font-size: 16px; margin: 0;">${format(targetDate, 'EEEE, MMMM do, yyyy')}</p>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">${startTime} - ${endTime}</p>
                </div>
            </div>
            
            <p style="color: #999; font-size: 12px; font-style: italic; border-top: 1px solid #eee; padding-top: 20px;">
                Sent via Cal.com Clone
            </p>
        </div>
    `;

    await sendEmail(email, `Confirmed: ${booking.eventType.title} with MeetFlow`, emailHtml);

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/bookings', async (req, res) => {
    const bookings = await prisma.booking.findMany({
        include: { eventType: true },
        orderBy: { date: 'asc' }
    });
    res.json(bookings);
});

app.post('/bookings/:id/reschedule', async (req, res) => {
    const { date, startTime, endTime } = req.body;
    try {
        const updated = await prisma.booking.update({
            where: { id: parseInt(req.params.id) },
            data: {
                date: new Date(date),
                startTime,
                endTime,
                notes: 'Rescheduled'
            }
        });

        const rescheduleHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
                <h2 style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px;">Meeting Rescheduled</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Your meeting has been moved to a new time.</p>
                
                <div style="background: #fff8f0; padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #ffe8cc;">
                    <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #e67e22; letter-spacing: 1px; margin-bottom: 5px;">New Time</p>
                    <p style="font-weight: bold; font-size: 16px; margin: 0;">${format(new Date(date), 'EEEE, MMMM do, yyyy')}</p>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">${startTime} - ${endTime}</p>
                </div>
            </div>
        `;

        await sendEmail(updated.email, `Rescheduled: ${updated.eventType?.title || 'Meeting'}`, rescheduleHtml);

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/event-types/:id', async (req, res) => {
    await prisma.eventType.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
});

app.put('/event-types/:id', async (req, res) => {
    const { title, description, slug, duration, bufferTime, scheduleId, questions } = req.body;
    const updated = await prisma.eventType.update({
        where: { id: parseInt(req.params.id) },
        data: { 
            title, description, slug, 
            duration: parseInt(duration), 
            bufferTime: parseInt(bufferTime || 0),
            scheduleId: scheduleId ? parseInt(scheduleId) : null,
            questions: questions || []
        }
    });
    res.json(updated);
});

app.delete('/bookings/:id', async (req, res) => {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Cancelled' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
