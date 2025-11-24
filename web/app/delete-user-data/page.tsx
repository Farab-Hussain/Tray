import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions - Tray",
  description: "Instructions for deleting your data from Tray",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Data Deletion Instructions
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Right to Delete Your Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At Tray, we respect your privacy and your right to control your
              personal information. You have the right to request deletion of
              your account and associated data at any time. This page explains
              how to delete your data from our system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How to Delete Your Account and Data
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Option 1: Delete Through the App (Recommended)
            </h3>
            <ol className="list-decimal pl-6 space-y-3 text-gray-700">
              <li>Open the Tray mobile application</li>
              <li>
                Navigate to <strong>Settings</strong> or{" "}
                <strong>Profile</strong>
              </li>
              <li>
                Select <strong>Account Settings</strong> or{" "}
                <strong>Privacy</strong>
              </li>
              <li>
                Tap on <strong>Delete Account</strong> or{" "}
                <strong>Delete My Data</strong>
              </li>
              <li>Follow the on-screen instructions to confirm deletion</li>
              <li>Enter your password to confirm (if required)</li>
              <li>Confirm that you want to permanently delete your account</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-8">
              Option 2: Request Deletion via Email
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you cannot access the app or prefer to request deletion via
              email, please send an email to:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@tray.app
                <br />
                <strong>Subject:</strong> Data Deletion Request
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-3">
              In your email, please include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Your full name</li>
              <li>The email address associated with your account</li>
              <li>
                A clear statement that you want to delete your account and all
                associated data
              </li>
              <li>
                Any additional information that may help us locate your account
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We will process your request within 30 days and send you a
              confirmation once your data has been deleted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What Data Will Be Deleted
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you delete your account, we will permanently delete the
              following information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Your account profile information (name, email, phone number,
                profile picture)
              </li>
              <li>Your account preferences and settings</li>
              <li>Your activity history and usage data</li>
              <li>Your messages and communications (if applicable)</li>
              <li>Your booking history and transaction records</li>
              <li>
                Any other personal information associated with your account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data That May Be Retained
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Please note that we may retain certain information in the
              following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Legal Requirements:</strong> Information required to be
                retained by law, regulation, or court order
              </li>
              <li>
                <strong>Financial Records:</strong> Transaction records required
                for accounting, tax, or financial reporting purposes (may be
                retained for up to 7 years as required by law)
              </li>
              <li>
                <strong>Anonymized Data:</strong> Aggregated or anonymized data
                that cannot be used to identify you
              </li>
              <li>
                <strong>Security:</strong> Information necessary to prevent
                fraud, abuse, or security issues
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Third-Party Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have used third-party services (such as social media login,
              payment processors, or analytics services) through our App, you
              may need to separately request deletion of your data from those
              services. We are not responsible for data stored by third-party
              services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Processing Time
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We will process your deletion request as quickly as possible,
              typically within 30 days of receiving your request. You will
              receive a confirmation email once your data has been deleted.
              During this period, your account will be deactivated and you will
              not be able to access it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Important Considerations
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                ⚠️ Before You Delete:
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                <li>
                  <strong>Irreversible Action:</strong> Account deletion is
                  permanent and cannot be undone
                </li>
                <li>
                  <strong>Data Loss:</strong> All your data, including messages,
                  bookings, and preferences, will be permanently lost
                </li>
                <li>
                  <strong>No Recovery:</strong> You will not be able to recover
                  any information after deletion
                </li>
                <li>
                  <strong>Active Services:</strong> If you have active bookings
                  or services, please complete or cancel them before deletion
                </li>
                <li>
                  <strong>Refunds:</strong> Any pending refunds or credits will
                  be processed according to our refund policy
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Alternative: Deactivate Instead of Delete
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you&apos;re unsure about permanent deletion, you may want to
              consider temporarily deactivating your account instead. This will
              hide your profile and prevent access, but your data will be
              retained and you can reactivate your account later. To deactivate
              your account, use the same steps above but select &quot;Deactivate
              Account&quot; instead of &quot;Delete Account.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Questions or Concerns
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about data deletion, need assistance
              with the deletion process, or want to verify that your data has
              been deleted, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@tray.app
                <br />
                <strong>Subject:</strong> Data Deletion Inquiry
                <br />
                <strong>Response Time:</strong> We aim to respond within 5
                business days
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Rights Under Data Protection Laws
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Depending on your location, you may have additional rights under
              data protection laws (such as GDPR, CCPA, etc.), including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to access your personal data</li>
              <li>Right to rectification (correction) of inaccurate data</li>
              <li>Right to erasure (deletion) of your data</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise any of these rights, please contact us at
              privacy@tray.app. We will respond to your request in accordance
              with applicable data protection laws.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📋 Quick Summary
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              To delete your data: (1) Open the Tray app → Settings → Delete
              Account, or (2) Email privacy@tray.app with your deletion request.
              Deletion is permanent and typically processed within 30 days. For
              more information, see our{" "}
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:underline font-semibold"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
