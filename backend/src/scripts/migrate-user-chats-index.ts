/**
 * One-time migration: populate RTDB userChats/{uid}/{chatId} from existing chats/.
 * Run from backend/: npx ts-node src/scripts/migrate-user-chats-index.ts
 */
import admin from 'firebase-admin';
import { firebaseApp } from '../config/firebase';

async function migrateUserChatsIndex() {
  const rtdb = admin.database(firebaseApp);
  const chatsSnap = await rtdb.ref('chats').once('value');

  if (!chatsSnap.exists()) {
    console.log('No chats to migrate.');
    return;
  }

  const updates: Record<string, { chatId: string; updatedAt: number }> = {};
  const chats = chatsSnap.val() as Record<string, { participants?: string[] }>;

  for (const chatId of Object.keys(chats)) {
    const participants = chats[chatId]?.participants || [];
    for (const uid of participants) {
      if (!uid) continue;
      updates[`userChats/${uid}/${chatId}`] = {
        chatId,
        updatedAt: Date.now(),
      };
    }
  }

  await rtdb.ref().update(updates);
  console.log(`Migrated ${Object.keys(updates).length} userChats index entries.`);
}

migrateUserChatsIndex()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
