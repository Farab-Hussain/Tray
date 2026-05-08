
import { db } from "./src/config/firebase";

async function test() {
    try {
        console.log("Testing Firestore connection...");
        const snapshot = await db.collection("users").limit(1).get();
        console.log("✅ Firestore connection successful!");
        console.log("Documents found:", snapshot.size);
    } catch (error: any) {
        console.error("❌ Firestore connection failed!");
        console.error("Error:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

test();
