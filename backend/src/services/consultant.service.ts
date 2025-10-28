import { db } from "../config/firebase";
import { Consultant } from "../models/consultant.model";


const COLLECTION = "consultants";

export const consultantServices = {
    async create(data: Consultant) {
        const consultant = await db.collection(COLLECTION).doc(data.uid).set(data);
        return data;
    },

    async getAll() {
        const snapshot = await db.collection(COLLECTION).get();
        const consultants = snapshot.docs.map((doc) => doc.data());
        
        // Filter consultants to only include those with approved services
        const consultantsWithServices = [];
        
        for (const consultant of consultants) {
            // Check if consultant has approved services
            const servicesSnapshot = await db.collection("services")
                .where("consultantId", "==", consultant.uid)
                .where("isDefault", "==", false)
                .get();
            
            if (!servicesSnapshot.empty) {
                consultantsWithServices.push(consultant);
            }
        }
        
        return consultantsWithServices;
    },

    async getById(uid: string) {
        const doc = await db.collection(COLLECTION).doc(uid).get();
        if (!doc.exists) throw new Error("Consultant not found");
        return doc.data();
    },


    async update(uid: string, data: Partial<Consultant>) {
        await db.collection(COLLECTION).doc(uid).update({
            ...data,
            updatedAt: new Date(),
        });
        const updated = await db.collection(COLLECTION).doc(uid).get();
        return updated.data();
    },

    async updateAvailability(uid: string, availability: Record<string, string[]>) {
        await db.collection(COLLECTION).doc(uid).update({ availability });
        return this.getById(uid);
    },

    async updateContactMethods(uid: string, contactMethods: Record<string, boolean>) {
        await db.collection(COLLECTION).doc(uid).update({ 
            contactMethods,
            updatedAt: new Date()
        });
        return this.getById(uid);
    },
}