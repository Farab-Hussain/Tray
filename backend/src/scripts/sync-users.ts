import { admin, db } from "../config/firebase";

/**
 * Script to sync all Firebase Authentication users to the Firestore 'users' collection.
 * Run this to restore the 'users' collection after accidental deletion.
 */
async function syncAuthUsersToFirestore() {
  console.log("🔄 Starting sync: Firebase Auth -> Firestore 'users' collection...");

  try {
    let nextPageToken: string | undefined;
    let totalSynced = 0;

    do {
      console.log(`📡 Fetching batch of users (pageToken: ${nextPageToken || 'initial'})...`);
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      console.log(`✅ Fetched ${listUsersResult.users.length} users from Auth.`);
      
      const batch = db.batch();
      let batchSize = 0;

      for (const userRecord of listUsersResult.users) {
        console.log(`🔍 Checking user: ${userRecord.email || userRecord.uid}`);
        const userRef = db.collection("users").doc(userRecord.uid);
        
        // Check if user already exists to avoid overwriting existing data if some were already recreated
        const doc = await userRef.get();
        
        if (!doc.exists) {
          // Determine default role (usually student, unless email contains admin)
          const role = userRecord.email?.includes('admin') ? 'admin' : 'student';

          const userData = {
            uid: userRecord.uid,
            name: userRecord.displayName || null,
            email: userRecord.email || null,
            role: role,
            roles: [role],
            activeRole: role,
            profileImage: userRecord.photoURL || null,
            isActive: true,
            createdAt: new Date(userRecord.metadata.creationTime),
            updatedAt: new Date(),
          };

          batch.set(userRef, userData);
          batchSize++;
          totalSynced++;
        }
      }

      if (batchSize > 0) {
        await batch.commit();
        console.log(`✅ Synced batch of ${batchSize} users`);
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\n🎉 Sync complete! Total users restored to Firestore: ${totalSynced}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

syncAuthUsersToFirestore();
