import { PrismaClient, Prisma } from "../lib/generated/prisma/client";
import { AuditAction } from "../lib/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Helper to generate random data
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Sample data
const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Henry",
  "Ivy",
  "Jack",
  "Kate",
  "Leo",
  "Mia",
  "Noah",
  "Olivia",
  "Peter",
  "Quinn",
  "Rose",
  "Sam",
  "Tina",
  "Uma",
  "Victor",
  "Wendy",
  "Xavier",
  "Yara",
  "Zack",
  "Anna",
  "Brian",
  "Chloe",
  "David",
  "Emma",
  "Felix",
  "Gina",
  "Hugo",
  "Iris",
];
const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
];
const APPOINTMENT_TITLES = [
  "Initial Consultation",
  "Follow-up Meeting",
  "Annual Review",
  "Project Kickoff",
  "Client Onboarding",
  "Team Sync",
  "Strategy Session",
  "Quarterly Review",
  "Performance Review",
  "Training Session",
  "Feedback Meeting",
  "Planning Session",
  "Budget Review",
  "Product Demo",
  "Technical Discussion",
];
const LOCATION_TYPES = [
  "Office",
  "Remote",
  "Phone",
  "Coffee Shop",
  "Conference Room",
  "Client Site",
];

const generateEmail = (firstName: string, lastName: string) =>
  `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

// Generate a single user with optional role
const generateUser = (
  firstName: string,
  lastName: string,
  role: "USER" | "ADMIN" = "USER",
): Prisma.UserCreateInput => ({
  id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: `${firstName} ${lastName}`,
  email: generateEmail(firstName, lastName),
  emailVerified: true,
  role,
});

// Generate a single appointment for cron testing
const generateCronTestAppointment = (
  userId: string,
  daysFromNow: number,
  hoursFromNow: number = 24,
): Prisma.AppointmentCreateWithoutUserInput => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + daysFromNow);
  startDate.setHours(startDate.getHours() + hoursFromNow, 0, 0, 0);

  const duration = randomInt(30, 120);
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);

  return {
    title: `[CRON TEST] ${randomElement(APPOINTMENT_TITLES)}`,
    description: `Test appointment for cron job - ${daysFromNow} days, ${hoursFromNow} hours from now`,
    startDateTime: startDate,
    endDateTime: endDate,
    duration,
    status: "SCHEDULED" as const,
    location: randomElement(LOCATION_TYPES),
    meetingUrl:
      Math.random() > 0.5
        ? `https://meet.example.com/cron-test-${Date.now()}`
        : null,
    emailNotificationSent: false,
    reminderSent: false,
    reminderSentAt: null,
  };
};

export async function main() {
  console.log("🌱 Starting database seed...\n");

  // 1. Create superuser admin
  const ADMIN_EMAIL = "admin@demo.com";
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Admin Demo",
      role: "ADMIN",
      emailVerified: true,
    },
    create: generateUser("Admin", "Demo", "ADMIN"),
  });
  console.log(`✅ Created admin: ${admin.email} (${admin.role})`);

  // 2. Create additional admin users (5 admins)
  const adminNames = [
    { first: "Admin", last: "User" },
    { first: "System", last: "Admin" },
    { first: "Super", last: "Admin" },
    { first: "Master", last: "Admin" },
    { first: "Head", last: "Admin" },
  ];

  const admins: string[] = [admin.id];
  for (const { first, last } of adminNames) {
    const email = generateEmail(first, last);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: generateUser(first, last, "ADMIN"),
    });
    admins.push(user.id);
    console.log(`✅ Created admin: ${user.email}`);
  }

  // 3. Create regular users (50 users)
  console.log("\n📋 Creating users...");
  const users: string[] = [];

  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const user = await prisma.user.upsert({
      where: { email: generateEmail(firstName, lastName) },
      update: {},
      create: generateUser(firstName, lastName),
    });
    users.push(user.id);
  }
  console.log(`✅ Created ${users.length} users`);

  // Combine all user IDs for creating appointments
  const allUserIds = [...admins, ...users];

  // 4. Create appointments for cron testing (next 30 days)
  console.log("\n📅 Creating cron test appointments...");
  const cronTestUserId = admin.id; // Use admin user for cron test appointments

  // Create appointments at different intervals for testing
  const cronIntervals = [
    { days: 0, hours: 0, minutes: 2, label: "2 minutes from now (test mode)" },
    { days: 0, hours: 0, minutes: 5, label: "5 minutes from now (test mode)" },
    { days: 0, hours: 2, label: "2 hours from now" },
    { days: 0, hours: 6, label: "6 hours from now" },
    { days: 0, hours: 12, label: "12 hours from now" },
    { days: 0, hours: 23, label: "23 hours from now" },
    { days: 0, hours: 24, label: "24 hours from now (will trigger cron)" },
    { days: 1, hours: 0, label: "1 day from now" },
    { days: 1, hours: 4, label: "1 day + 4 hours from now" },
    { days: 3, hours: 0, label: "3 days from now" },
    { days: 7, hours: 0, label: "7 days from now" },
    { days: 14, hours: 0, label: "14 days from now" },
    { days: 30, hours: 0, label: "30 days from now" },
  ];

  // Create multiple appointments at each interval for thorough testing
  let cronAppointmentCount = 0;
  for (let userIdx = 0; userIdx < Math.min(5, users.length); userIdx++) {
    const testUserId = users[userIdx];
    for (const interval of cronIntervals) {
      const { days, hours, minutes = 0 } = interval;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + days);
      startDate.setHours(
        startDate.getHours() + hours,
        startDate.getMinutes() + minutes,
        0,
        0,
      );

      const duration = randomInt(30, 120);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);

      await prisma.appointment.create({
        data: {
          title: `[CRON TEST] ${randomElement(APPOINTMENT_TITLES)}`,
          description: `Test appointment for cron job - ${days} days, ${hours} hours, ${minutes} minutes from now`,
          startDateTime: startDate,
          endDateTime: endDate,
          duration,
          status: "SCHEDULED" as const,
          location: randomElement(LOCATION_TYPES),
          meetingUrl:
            Math.random() > 0.5
              ? `https://meet.example.com/cron-test-${Date.now()}`
              : null,
          emailNotificationSent: false,
          reminderSent: false,
          reminderSentAt: null,
          userId: testUserId,
        },
      });
      cronAppointmentCount++;
    }
  }
  console.log(`✅ Created ${cronAppointmentCount} cron test appointments`);

  // 5. Create random historical appointments (for normal operation)
  console.log("\n📅 Creating random appointments...");
  const randomAppointmentCount = 100;
  let randomCount = 0;

  for (let i = 0; i < randomAppointmentCount; i++) {
    const userId = users[randomInt(0, users.length - 1)];
    const daysOffset = randomInt(-30, 30);
    const appointment = await prisma.appointment.create({
      data: {
        title: randomElement(APPOINTMENT_TITLES),
        description: `Random appointment ${i + 1}`,
        startDateTime: randomDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ),
        endDateTime: new Date(),
        duration: randomInt(30, 120),
        status: randomElement([
          "SCHEDULED",
          "COMPLETED",
          "CANCELLED",
          "NO_SHOW",
        ]),
        location: randomElement(LOCATION_TYPES),
        meetingUrl:
          Math.random() > 0.5 ? `https://meet.example.com/${i}` : null,
        emailNotificationSent: Math.random() > 0.5,
        reminderSent: Math.random() > 0.5,
        reminderSentAt: randomDate(new Date(2024, 0, 1), new Date()),
        userId,
      },
    });
    randomCount++;
  }
  console.log(`✅ Created ${randomCount} random appointments`);

  // 6. Create audit logs
  console.log("\n📝 Creating audit logs...");
  const auditActions: AuditAction[] = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "VIEW",
    "CANCEL",
    "COMPLETE",
    "RESCHEDULE",
  ];
  const entityTypes = ["Appointment", "User", "Notification", "Account"];
  let auditCount = 0;

  for (const userId of allUserIds) {
    const numLogs = randomInt(3, 10);
    for (let i = 0; i < numLogs; i++) {
      await prisma.auditLog.create({
        data: {
          action: randomElement(auditActions),
          entityType: randomElement(entityTypes),
          entityId: `entity_${Math.random().toString(36).substr(2, 8)}`,
          oldValues: Math.random() > 0.5 ? { previous: "value" } : undefined,
          newValues: Math.random() > 0.5 ? { new: "value" } : undefined,
          ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          createdById: userId,
        },
      });
      auditCount++;
    }
  }
  console.log(`✅ Created ${auditCount} audit logs`);

  // 7. Create notifications
  console.log("\n🔔 Creating notifications...");
  const notificationTypes = [
    "appointment",
    "reminder",
    "system",
    "update",
    "alert",
  ];
  let notificationCount = 0;

  for (const userId of allUserIds) {
    const numNotifications = randomInt(3, 8);
    for (let i = 0; i < numNotifications; i++) {
      await prisma.notification.create({
        data: {
          title: `Notification ${i + 1}`,
          description: `This is notification number ${i + 1} for user`,
          type: randomElement(notificationTypes),
          read: Math.random() > 0.4,
          readAt:
            Math.random() > 0.6
              ? randomDate(new Date(2024, 0, 1), new Date())
              : null,
          userId,
        },
      });
      notificationCount++;
    }
  }
  console.log(`✅ Created ${notificationCount} notifications`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Seed completed successfully!");
  console.log("=".repeat(50));
  console.log(`📊 Total records created:`);
  console.log(
    `   - Users: ${allUserIds.length} (${admins.length} admins, ${users.length} regular)`,
  );
  console.log(`   - Cron Test Appointments: ${cronAppointmentCount}`);
  console.log(`   - Random Appointments: ${randomCount}`);
  console.log(`   - Audit Logs: ${auditCount}`);
  console.log(`   - Notifications: ${notificationCount}`);
  console.log(
    `   - Total: ${allUserIds.length + cronAppointmentCount + randomCount + auditCount + notificationCount}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
