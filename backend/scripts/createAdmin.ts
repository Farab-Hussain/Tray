import { auth, db } from "../src/config/firebase";

const ADMIN_EMAIL = "tray@admin.com";
const ADMIN_PASSWORD = "Admin@123";

async function createAdminUser() {
  try {
    console.log("🔐 Creating admin user...");
    console.log(`   Email: ${ADMIN_EMAIL}`);

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`⚠️  User with email ${ADMIN_EMAIL} already exists (UID: ${userRecord.uid})`);
      
      // Update password if user exists
      await auth.updateUser(userRecord.uid, {
        password: ADMIN_PASSWORD,
        emailVerified: true,
      });
      console.log("✅ Password updated for existing user");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // User doesn't exist, create new one
        userRecord = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true,
        });
        console.log(`✅ Firebase Auth user created (UID: ${userRecord.uid})`);
      } else {
        throw error;
      }
    }

    // Check if user document exists in Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      // Update existing user document to ensure admin role
      await db.collection("users").doc(userRecord.uid).update({
        role: "admin",
        roles: ["admin"],
        activeRole: "admin",
        email: ADMIN_EMAIL,
        isActive: true,
        updatedAt: new Date(),
      });
      console.log("✅ User document updated with admin role");
    } else {
      // Create new user document
      await db.collection("users").doc(userRecord.uid).set({
        name: "Admin User",
        role: "admin",
        roles: ["admin"],
        activeRole: "admin",
        email: ADMIN_EMAIL,
        profileImage: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ User document created with admin role");
    }

    console.log("\n✅ Admin user created/updated successfully!");
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("\n📝 You can now log in to the web application with these credentials.");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();

