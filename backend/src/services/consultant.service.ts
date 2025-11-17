import { db } from "../config/firebase";
import { Consultant } from "../models/consultant.model";


const COLLECTION = "consultants";

export const consultantServices = {
    async create(data: Consultant) {
        const consultant = await db.collection(COLLECTION).doc(data.uid).set(data);
        return data;
    },

    async getAll() {
        // Optimized: Get all consultants with approved services in a single query
        // First, get all services with approved status grouped by consultantId
        const servicesSnapshot = await db.collection("services")
            .where("isDefault", "==", false)
            .get();
        
        // Build a Set of consultantIds that have approved services
        const consultantIdsWithServices = new Set<string>();
        servicesSnapshot.docs.forEach(doc => {
            const serviceData = doc.data();
            if (serviceData.consultantId) {
                consultantIdsWithServices.add(serviceData.consultantId);
            }
        });
        
        // If no services found, return empty array
        if (consultantIdsWithServices.size === 0) {
            return [];
        }
        
        // Fetch only consultants that have services (in parallel batches)
        const consultantPromises = Array.from(consultantIdsWithServices).map(uid => 
            db.collection(COLLECTION).doc(uid).get()
        );
        
        const consultantDocs = await Promise.all(consultantPromises);
        
        // Map to consultant data
        const consultants = consultantDocs
            .filter(doc => doc.exists)
            .map(doc => doc.data());
        
        return consultants;
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