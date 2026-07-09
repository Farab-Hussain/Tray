/**
 * One-off repair: copy name / email / profileImage from consultantProfiles
 * into users/{uid} (and Auth displayName/photoURL) for all consultants.
 *
 * Usage: npx ts-node scripts/syncConsultantProfilesToUsers.ts
 */

import { auth, db } from "../src/config/firebase";
import { cache } from "../src/utils/cache";

async function main() {
  const snapshot = await db.collection("consultantProfiles").get();
  console.log(`Found ${snapshot.size} consultant profile(s)\n`);

  let synced = 0;
  for (const doc of snapshot.docs) {
    const profile = doc.data();
    const uid = profile.uid || doc.id;
    const name = profile.personalInfo?.fullName?.trim() || null;
    const email = profile.personalInfo?.email?.trim() || null;
    const profileImage = profile.personalInfo?.profileImage?.trim() || null;
    const quals = profile.personalInfo?.qualifications;

    console.log(`—— ${uid} ——`);
    console.log(`  name: ${name}`);
    console.log(`  email: ${email}`);
    console.log(`  image: ${profileImage ? "yes" : "no"}`);
    console.log(`  certs: ${Array.isArray(quals) ? quals.length : 0}`);

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const existing = userDoc.exists ? userDoc.data() || {} : {};
    const roles: string[] = Array.isArray(existing.roles) ? [...existing.roles] : [];
    if (!roles.includes("consultant")) roles.push("consultant");

    await userRef.set(
      {
        name: name || existing.name || null,
        email: email || existing.email || null,
        profileImage: profileImage || existing.profileImage || null,
        role: existing.role === "admin" ? "admin" : "consultant",
        roles,
        activeRole: existing.role === "admin" ? "admin" : "consultant",
        isActive: true,
        updatedAt: new Date(),
        ...(userDoc.exists ? {} : { createdAt: new Date() }),
      },
      { merge: true },
    );
    cache.delete(`user:${uid}`);

    try {
      const authUpdate: { displayName?: string; photoURL?: string } = {};
      if (name) authUpdate.displayName = name;
      if (profileImage) authUpdate.photoURL = profileImage;
      if (Object.keys(authUpdate).length) {
        await auth.updateUser(uid, authUpdate);
      }
    } catch (err: any) {
      console.warn(`  Auth update skipped: ${err.message}`);
    }

    synced++;
    console.log(`  ✅ synced\n`);
  }

  console.log(`Done. Synced ${synced} profile(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
