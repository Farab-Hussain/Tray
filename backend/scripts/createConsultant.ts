import { auth, db } from "../src/config/firebase";

const CONSULTANT_EMAIL = "tray@consultant.com";
const CONSULTANT_PASSWORD = "Test@123";
const CONSULTANT_NAME = "Tray Consultant";

async function createConsultantUser() {
  try {
    console.log("🔐 Creating consultant user...");
    console.log(`   Email: ${CONSULTANT_EMAIL}`);

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(CONSULTANT_EMAIL);
      console.log(`⚠️  User with email ${CONSULTANT_EMAIL} already exists (UID: ${userRecord.uid})`);
      
      // Update password and verify email if user exists
      await auth.updateUser(userRecord.uid, {
        password: CONSULTANT_PASSWORD,
        emailVerified: true,
      });
      console.log("✅ Password updated and email verified for existing user");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // User doesn't exist, create new one
        userRecord = await auth.createUser({
          email: CONSULTANT_EMAIL,
          password: CONSULTANT_PASSWORD,
          emailVerified: true,
          displayName: CONSULTANT_NAME,
        });
        console.log(`✅ Firebase Auth user created (UID: ${userRecord.uid})`);
        console.log(`✅ Email verified: ${userRecord.emailVerified}`);
      } else {
        throw error;
      }
    }

    // Check if user document exists in Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      // Update existing user document to ensure consultant role
      await db.collection("users").doc(userRecord.uid).update({
        name: CONSULTANT_NAME,
        role: "consultant",
        roles: ["consultant", "student"], // Consultant can also act as student
        activeRole: "consultant",
        email: CONSULTANT_EMAIL,
        isActive: true,
        updatedAt: new Date(),
      });
      console.log("✅ User document updated with consultant role");
    } else {
      // Create new user document
      await db.collection("users").doc(userRecord.uid).set({
        name: CONSULTANT_NAME,
        role: "consultant",
        roles: ["consultant", "student"], // Consultant can also act as student
        activeRole: "consultant",
        email: CONSULTANT_EMAIL,
        profileImage: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ User document created with consultant role");
    }

    // Verify email is verified in Firebase Auth
    const updatedUser = await auth.getUser(userRecord.uid);
    if (!updatedUser.emailVerified) {
      await auth.updateUser(userRecord.uid, {
        emailVerified: true,
      });
      console.log("✅ Email verification status updated to verified");
    }

    console.log("\n✅ Consultant user created/updated successfully!");
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${CONSULTANT_EMAIL}`);
    console.log(`   Password: ${CONSULTANT_PASSWORD}`);
    console.log(`   Role: consultant`);
    console.log(`   Email Verified: true`);
    console.log("\n📝 You can now log in to the mobile app with these credentials.");
    console.log("📝 The email is already verified, so you can proceed directly.");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating consultant user:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createConsultantUser();

