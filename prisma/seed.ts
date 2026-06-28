/**
 * EthioTelecom Issue Tracker — Demo Seed Script
 * Run with: npx tsx prisma/seed.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000);

async function main() {
  console.log('🌱 Seeding EthioTelecom demo data...');

  // ── Users ────────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Abebe Girma',
      email: 'admin@ethiotelecom.et',
      role: 'ADMIN',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=AG&backgroundColor=00A651&textColor=ffffff',
    },
  });

  const engineer1 = await prisma.user.upsert({
    where: { email: 'sara.bekele@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Sara Bekele',
      email: 'sara.bekele@ethiotelecom.et',
      role: 'USER',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=SB&backgroundColor=00A651&textColor=ffffff',
    },
  });

  const engineer2 = await prisma.user.upsert({
    where: { email: 'daniel.tesfaye@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Daniel Tesfaye',
      email: 'daniel.tesfaye@ethiotelecom.et',
      role: 'USER',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=DT&backgroundColor=00A651&textColor=ffffff',
    },
  });

  const engineer3 = await prisma.user.upsert({
    where: { email: 'meron.haile@ethiotelecom.et' },
    update: {},
    create: {
      name: 'Meron Haile',
      email: 'meron.haile@ethiotelecom.et',
      role: 'USER',
      isActive: true,
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=MH&backgroundColor=00A651&textColor=ffffff',
    },
  });

  console.log('✅ Users created');

  // ── Issues ───────────────────────────────────────────────────────────────────
  const issues = await Promise.all([

    // 1. Critical — overdue (dueDate in past, still OPEN)
    prisma.issue.create({ data: {
      title: '4G LTE Tower Outage — Bole Subcity',
      description: 'The 4G LTE base station at Bole Medhanealem has been completely offline since 14:30 EAT. Approximately 3,200 subscribers in the coverage area are without mobile data service. Initial diagnostics indicate a power supply unit failure at the tower site. Generator backup failed to activate automatically. Field technicians have been dispatched but require spare PSU components from the central warehouse.',
      status: 'OPEN',
      priority: 'CRITICAL',
      category: 'MOBILE_NETWORK',
      department: 'Network',
      dueDate: daysAgo(2),
      reporterId: engineer1.id,
      assigneeId: engineer2.id,
    }}),

    // 2. Critical — overdue (dueDate in past, IN_PROGRESS)
    prisma.issue.create({ data: {
      title: 'Core Router Failure — Addis Ababa Data Center',
      description: 'The primary core router at the Addis Ababa central data center experienced a critical hardware fault at 02:15 EAT. This is causing packet loss of approximately 40% for all traffic routed through this node, affecting both residential and enterprise customers across the capital. Redundant path has been partially activated but is not handling full load. Vendor support (Huawei) has been engaged and a replacement unit is en route from Nairobi.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      category: 'CORE_INFRASTRUCTURE',
      department: 'Network',
      dueDate: daysAgo(1),
      reporterId: admin.id,
      assigneeId: engineer2.id,
    }}),

    // 3. High — due soon (approaching)
    prisma.issue.create({ data: {
      title: 'Telebirr Transaction Failures — Merchant API',
      description: 'Multiple merchants in the Merkato commercial district are reporting failed Telebirr payment transactions since 09:00 EAT. The merchant API gateway is returning HTTP 504 timeout errors on approximately 15% of transaction requests. This is affecting point-of-sale systems for over 200 registered merchants. The issue appears to be related to increased load on the payment processing cluster following a promotional campaign launched yesterday.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'TELEBIRR_BILLING',
      department: 'IT',
      dueDate: daysFromNow(1),
      reporterId: engineer3.id,
      assigneeId: engineer1.id,
    }}),

    // 4. High — open, future due date
    prisma.issue.create({ data: {
      title: 'Fiber Broadband Degradation — Kazanchis Business District',
      description: 'Enterprise fiber broadband customers in the Kazanchis area are experiencing download speeds of 10-15 Mbps instead of the contracted 100 Mbps. The degradation started approximately 48 hours ago and has been confirmed on multiple customer lines. Preliminary investigation suggests a fiber splice issue at the Kazanchis optical distribution frame. Seven enterprise accounts including two embassies and a major bank have escalated the complaint.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'FIBER_BROADBAND',
      department: 'Network',
      dueDate: daysFromNow(3),
      reporterId: engineer2.id,
      assigneeId: engineer3.id,
    }}),

    // 5. Medium — in progress
    prisma.issue.create({ data: {
      title: 'Billing System Incorrect Charges — Postpaid Customers',
      description: 'Customer service has received over 150 complaints in the past 24 hours from postpaid subscribers who were charged incorrectly on their monthly bills. The overcharges range from 50 ETB to 800 ETB. Investigation shows that the billing system applied data bundle rates incorrectly during the migration to the new tariff structure on the 1st of this month. A refund process needs to be initiated for all affected accounts.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      category: 'TELEBIRR_BILLING',
      department: 'Finance',
      dueDate: daysFromNow(5),
      reporterId: engineer3.id,
      assigneeId: engineer1.id,
    }}),

    // 6. Medium — open, no due date
    prisma.issue.create({ data: {
      title: 'SMS Gateway Intermittent Failures — International Originating',
      description: 'International SMS messages originating from MTN Nigeria, Safaricom Kenya, and Vodacom Tanzania are intermittently failing to deliver to EthioTelecom subscribers. The failure rate is approximately 8% of inbound international SMS traffic. The issue has been observed since the SMPP gateway firmware update applied last Thursday. Rollback to the previous firmware version is being evaluated.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'MOBILE_NETWORK',
      department: 'Network',
      reporterId: engineer1.id,
      assigneeId: engineer2.id,
    }}),

    // 7. Medium — open, Customer Service dept
    prisma.issue.create({ data: {
      title: 'IVR System Not Routing Calls — Call Center',
      description: 'The Interactive Voice Response (IVR) system for the customer service hotline (994) has been misrouting calls since 07:00 EAT. Customers selecting option 2 for "Technical Support" are being routed to the "Billing" queue instead. This is causing significant wait times in the Technical Support queue and customer dissatisfaction. The IVR configuration was last modified two days ago.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'OTHER',
      department: 'Customer Service',
      dueDate: daysFromNow(2),
      reporterId: engineer3.id,
    }}),

    // 8. Low — closed (resolved)
    prisma.issue.create({ data: {
      title: 'Staff VPN Access Issue — HR Department',
      description: 'Several HR department staff members were unable to connect to the corporate VPN after a password policy enforcement update. Affected users received error "Authentication failed: certificate mismatch" when attempting to connect via Cisco AnyConnect. The issue affected 12 users in the HR department and prevented access to internal HR systems for approximately 3 hours.',
      status: 'CLOSED',
      priority: 'LOW',
      category: 'OTHER',
      department: 'HR',
      dueDate: daysAgo(3),
      reporterId: engineer2.id,
      assigneeId: engineer3.id,
    }}),

    // 9. Low — closed (resolved)
    prisma.issue.create({ data: {
      title: 'Network Monitoring Dashboard Latency',
      description: 'The NOC network monitoring dashboard (Grafana) was loading with 15-20 second delays, making real-time network monitoring difficult for the Network Operations Center team. The issue was traced to an inefficient Prometheus query that was running full table scans on the metrics database every 30 seconds. Query optimization and index updates resolved the performance issue.',
      status: 'CLOSED',
      priority: 'LOW',
      category: 'CORE_INFRASTRUCTURE',
      department: 'IT',
      reporterId: admin.id,
      assigneeId: engineer1.id,
    }}),

    // 10. High — open, Fiber
    prisma.issue.create({ data: {
      title: 'Fiber Cut — Dire Dawa–Harar Trunk Line',
      description: 'A fiber optic trunk line between Dire Dawa and Harar has been physically cut, likely due to road construction activity near Kilometer 47 of the Dire Dawa–Harar highway. This is affecting both residential and enterprise connectivity for the Harar region, impacting approximately 8,500 subscribers. Traffic is being rerouted via the Jigjiga backup path but this is adding 45ms of additional latency and bandwidth is limited to 60% of normal capacity.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'FIBER_BROADBAND',
      department: 'Network',
      dueDate: daysFromNow(4),
      reporterId: engineer2.id,
      assigneeId: engineer2.id,
    }}),
  ]);

  console.log(`✅ ${issues.length} issues created`);

  // ── Comments ─────────────────────────────────────────────────────────────────
  await prisma.comment.createMany({ data: [
    {
      content: 'Field team has arrived at the tower site. Confirming PSU failure. Requesting urgent delivery of Huawei BBU3900 power module from Addis central warehouse.',
      authorId: engineer2.id,
      issueId: issues[0].id,
    },
    {
      content: 'Spare parts dispatched from warehouse. ETA to site: 4 hours. Tower should be back online by 20:00 EAT.',
      authorId: admin.id,
      issueId: issues[0].id,
    },
    {
      content: 'Huawei TAC (Technical Assistance Center) confirmed the root cause: memory corruption in the route table. Workaround applied — traffic now routing at 90% capacity. Full fix requires router replacement.',
      authorId: engineer2.id,
      issueId: issues[1].id,
    },
    {
      content: 'Load balancer rules updated to distribute traffic more evenly. Transaction success rate improved from 85% to 97%. Monitoring closely.',
      authorId: engineer1.id,
      issueId: issues[2].id,
    },
    {
      content: 'Refund batch processing script prepared. Finance team approval needed before execution. Total refund amount: 127,450 ETB for 163 affected accounts.',
      authorId: engineer1.id,
      issueId: issues[4].id,
    },
    {
      content: 'VPN certificates re-issued for all 12 affected users. All users confirmed working as of 11:30 EAT. Root cause was a certificate CN mismatch after domain rename.',
      authorId: engineer3.id,
      issueId: issues[7].id,
    },
  ]});

  console.log('✅ Comments created');

  // ── Activity Logs ─────────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({ data: [
    // Issue 1
    { issueId: issues[0].id, actorId: engineer1.id, action: 'ISSUE_CREATED', createdAt: daysAgo(3) },
    { issueId: issues[0].id, actorId: admin.id, action: 'ASSIGNEE_CHANGED', oldValue: null, newValue: 'Daniel Tesfaye', createdAt: daysAgo(3) },
    { issueId: issues[0].id, actorId: admin.id, action: 'PRIORITY_CHANGED', oldValue: 'HIGH', newValue: 'CRITICAL', createdAt: daysAgo(2) },
    // Issue 2
    { issueId: issues[1].id, actorId: admin.id, action: 'ISSUE_CREATED', createdAt: daysAgo(5) },
    { issueId: issues[1].id, actorId: admin.id, action: 'STATUS_CHANGED', oldValue: 'OPEN', newValue: 'IN_PROGRESS', createdAt: daysAgo(4) },
    // Issue 3
    { issueId: issues[2].id, actorId: engineer3.id, action: 'ISSUE_CREATED', createdAt: daysAgo(1) },
    { issueId: issues[2].id, actorId: engineer1.id, action: 'STATUS_CHANGED', oldValue: 'OPEN', newValue: 'IN_PROGRESS', createdAt: daysAgo(0) },
    // Issue 8 — closed
    { issueId: issues[7].id, actorId: engineer2.id, action: 'ISSUE_CREATED', createdAt: daysAgo(5) },
    { issueId: issues[7].id, actorId: engineer3.id, action: 'STATUS_CHANGED', oldValue: 'OPEN', newValue: 'IN_PROGRESS', createdAt: daysAgo(4) },
    { issueId: issues[7].id, actorId: engineer3.id, action: 'STATUS_CHANGED', oldValue: 'IN_PROGRESS', newValue: 'CLOSED', createdAt: daysAgo(3) },
    // Issue 9 — closed
    { issueId: issues[8].id, actorId: admin.id, action: 'ISSUE_CREATED', createdAt: daysAgo(7) },
    { issueId: issues[8].id, actorId: engineer1.id, action: 'STATUS_CHANGED', oldValue: 'OPEN', newValue: 'CLOSED', createdAt: daysAgo(6) },
  ]});

  console.log('✅ Activity logs created');
  console.log('\n🎉 Seed complete! Your demo data is ready.');
  console.log('\nDemo users:');
  console.log('  Admin: admin@ethiotelecom.et (role: ADMIN)');
  console.log('  Engineer 1: sara.bekele@ethiotelecom.et');
  console.log('  Engineer 2: daniel.tesfaye@ethiotelecom.et');
  console.log('  Engineer 3: meron.haile@ethiotelecom.et');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
