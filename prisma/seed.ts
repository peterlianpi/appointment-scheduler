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

// Generate a single appointment
const generateAppointment = (
  userId: string,
  daysOffset: number,
): Prisma.AppointmentCreateWithoutUserInput => {
  const startHour = randomInt(8, 17);
  const duration = randomInt(30, 120);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + randomInt(-30, 60) + daysOffset);
  startDate.setHours(startHour, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);

  return {
    title: randomElement(APPOINTMENT_TITLES),
    description: `Meeting with client for ${randomElement(APPOINTMENT_TITLES).toLowerCase()}`,
    startDateTime: startDate,
    endDateTime: endDate,
    duration,
    status: randomElement(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
    location: randomElement(LOCATION_TYPES),
    meetingUrl:
      Math.random() > 0.5
        ? `https://meet.example.com/${Math.random().toString(36).substr(2, 8)}`
        : null,
    emailNotificationSent: Math.random() > 0.3,
    reminderSent: Math.random() > 0.5,
    reminderSentAt: randomDate(new Date(2024, 0, 1), new Date()),
  };
};

export async function main() {
  console.log("🌱 Starting database seed...\n");

  // 1. Create superuser admin
  const ADMIN_EMAIL = "peterpausianlian2020@gmail.com";
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Peter Pausian Lian",
      role: "ADMIN",
      emailVerified: true,
    },
    create: generateUser("Peter", "Pausian", "ADMIN"),
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

  // 4. Create appointments (500+ appointments)
  console.log("\n📅 Creating appointments...");
  const allUserIds = [...admins, ...users];
  let appointmentCount = 0;

  // Create appointments per user (10-30 per user)
  for (const userId of allUserIds) {
    const numAppointments = randomInt(10, 30);
    for (let i = 0; i < numAppointments; i++) {
      await prisma.appointment.create({
        data: {
          ...generateAppointment(userId, i * 2),
          userId,
        },
      });
      appointmentCount++;
    }
  }
  console.log(`✅ Created ${appointmentCount} appointments`);

  // 5. Create audit logs (300+ logs)
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

  // 6. Create notifications (200+ notifications)
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
  console.log(`   - Appointments: ${appointmentCount}`);
  console.log(`   - Audit Logs: ${auditCount}`);
  console.log(`   - Notifications: ${notificationCount}`);
  console.log(
    `   - Total: ${allUserIds.length + appointmentCount + auditCount + notificationCount}`,
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
