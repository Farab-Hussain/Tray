/**
 * Wipe all app content data for App Store / Play Store screenshot setup.
 *
 * KEEPS:
 * - Admin Auth user + users/{adminUid} (tray@admin.com)
 * - settings / platformSettings (platform config)
 *
 * DELETES:
 * - All other Firebase Auth users
 * - All listed Firestore collections (and known subcollections)
 * - Realtime Database chats/ and userChats/
 *
 * Usage:
 *   npx ts-node scripts/wipeDemoData.ts --confirm
 */

import { admin, auth, db, firebaseApp } from "../src/config/firebase";

const ADMIN_EMAIL = "tray@admin.com";
const CONFIRM = process.argv.includes("--confirm");

/** Top-level Firestore collections to fully wipe */
const COLLECTIONS_TO_WIPE = [
  // Users & profiles (admin user doc re-kept after Auth wipe)
  "users",
  "students",
  "consultants",
  "consultantProfiles",
  "consultantApplications",
  "consultantContent",
  "contentRatings",

  // Services / bookings / reviews
  "services",
  "bookings",
  "reviews",

  // Courses
  "courses",
  "courseEnrollments",
  "courseReviews",
  "coursePurchases",
  "courseCertificates",
  "courseVideos",
  "courseResources",
  "courseLessons",
  "videoProcessingJobs",
  "videoProgress",
  "learningGoals",
  "goalProgress",
  "learningAnalytics",
  "certificateTemplates",

  // Jobs / recruiters
  "jobs",
  "jobApplications",
  "jobAiSnapshots",
  "jobPostingPayments",
  "companies",
  "companyVerifications",

  // Student docs
  "resumes",
  "authorizationDocuments",
  "files",

  // Chat / calls / notifications (Firestore)
  "chats",
  "notifications",
  "calls",

  // Payments / comms / misc
  "paymentTransactions",
  "payouts",
  "broadcasts",
  "newsletters",
  "password_resets",
  "email_verification_tokens",
  "securityEvents",
  "securityAuditLogs",
  "documentAccessLogs",
  "_test",
];

/** Known subcollections under parent docs */
const SUBCOLLECTIONS: Record<string, string[]> = {
  users: ["fcmTokens", "voipTokens"],
  calls: ["candidates"],
  chats: ["messages"],
};

async function deleteQueryBatch(
  collectionRef: admin.firestore.CollectionReference,
  batchSize = 400,
): Promise<number> {
  let deleted = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    process.stdout.write(`\r   deleted ${deleted}...`);
  }
  if (deleted > 0) process.stdout.write("\n");
  return deleted;
}

async function wipeCollection(name: string): Promise<number> {
  const col = db.collection(name);
  const subNames = SUBCOLLECTIONS[name] || [];

  // Delete known subcollections first
  if (subNames.length > 0) {
    const parents = await col.get();
    for (const parent of parents.docs) {
      for (const sub of subNames) {
        const n = await deleteQueryBatch(parent.ref.collection(sub));
        if (n > 0) {
          console.log(`   └─ ${name}/${parent.id}/${sub}: ${n}`);
        }
      }
    }
  }

  const deleted = await deleteQueryBatch(col);
  return deleted;
}

async function wipeAuthUsers(keepUid: string | null): Promise<number> {
  let deleted = 0;
  let nextPageToken: string | undefined;

  do {
    const list = await auth.listUsers(1000, nextPageToken);
    for (const user of list.users) {
      if (keepUid && user.uid === keepUid) {
        console.log(`   ⏭  Keeping admin: ${user.email} (${user.uid})`);
        continue;
      }
      await auth.deleteUser(user.uid);
      deleted++;
      console.log(`   🗑  Auth user: ${user.email || user.uid}`);
    }
    nextPageToken = list.pageToken;
  } while (nextPageToken);

  return deleted;
}

async function restoreAdminUserDoc(adminUid: string, email: string) {
  await db.collection("users").doc(adminUid).set(
    {
      name: "Admin User",
      role: "admin",
      roles: ["admin"],
      activeRole: "admin",
      email,
      profileImage: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true },
  );
  console.log(`✅ Restored admin users/${adminUid}`);
}

async function wipeRealtimeChat() {
  const rtdb = admin.database(firebaseApp);
  await rtdb.ref("chats").remove();
  console.log("✅ RTDB chats/ removed");
  await rtdb.ref("userChats").remove();
  console.log("✅ RTDB userChats/ removed");
}

async function main() {
  console.log("\n🧹 Tray demo data wipe");
  console.log(`   Project: ${firebaseApp.options.projectId}`);
  console.log(`   Keep admin: ${ADMIN_EMAIL}`);
  console.log(
    `   Keep collections: settings, platformSettings\n`,
  );

  if (!CONFIRM) {
    console.error("❌ Refusing to run without --confirm");
    console.error("   Example: npx ts-node scripts/wipeDemoData.ts --confirm");
    process.exit(1);
  }

  // Resolve admin UID first
  let adminUid: string | null = null;
  try {
    const adminRecord = await auth.getUserByEmail(ADMIN_EMAIL);
    adminUid = adminRecord.uid;
    console.log(`✅ Found admin UID: ${adminUid}\n`);
  } catch {
    console.warn(`⚠️  Admin ${ADMIN_EMAIL} not found in Auth — will wipe all Auth users\n`);
  }

  // 1) Firestore collections
  console.log("—— Firestore ——");
  for (const name of COLLECTIONS_TO_WIPE) {
    try {
      const n = await wipeCollection(name);
      console.log(`✅ ${name}: ${n} docs`);
    } catch (err: any) {
      console.warn(`⚠️  ${name}: ${err.message || err}`);
    }
  }

  // 2) Realtime Database chats
  console.log("\n—— Realtime Database ——");
  try {
    await wipeRealtimeChat();
  } catch (err: any) {
    console.warn(`⚠️  RTDB wipe failed: ${err.message || err}`);
  }

  // 3) Auth users (except admin)
  console.log("\n—— Firebase Auth ——");
  const authDeleted = await wipeAuthUsers(adminUid);
  console.log(`✅ Auth users deleted: ${authDeleted}`);

  // 4) Restore admin Firestore doc if we wiped users/
  if (adminUid) {
    console.log("\n—— Restore admin ——");
    await restoreAdminUserDoc(adminUid, ADMIN_EMAIL);
  }

  console.log("\n🎉 Wipe complete.");
  console.log("   Kept: settings/, platformSettings/, admin Auth + users doc");
  console.log("   You can now create fresh consultants, services, and courses.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Wipe failed:", err);
  process.exit(1);
});
