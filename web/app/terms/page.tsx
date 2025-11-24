import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Tray",
  description: "Terms of Service for Tray application",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using the Tray mobile application (&quot;App&quot;), you
              agree to be bound by these Terms of Service (&quot;Terms&quot;). If you
              disagree with any part of these terms, then you may not access the
              App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Tray is a mobile application that connects users with services and
              facilitates communication, bookings, and transactions. The App
              provides a platform for users to access various services and
              interact with service providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Accounts
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              3.1 Account Creation
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use certain features of the App, you must register for an
              account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Provide accurate, current, and complete information during
                registration
              </li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and identification</li>
              <li>
                Accept all responsibility for activities that occur under your
                account
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              3.2 Account Eligibility
            </h3>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 13 years old to use the App. By using the
              App, you represent and warrant that you meet this age requirement
              and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree not to use the App to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any harmful, offensive, or inappropriate content</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the App or servers</li>
              <li>
                Attempt to gain unauthorized access to any portion of the App
              </li>
              <li>
                Use automated systems to access the App without permission
              </li>
              <li>Collect or harvest information about other users</li>
              <li>Engage in any fraudulent or deceptive practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Payments and Transactions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you make purchases or transactions through the App:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                You agree to pay all charges associated with your use of the App
              </li>
              <li>
                All payments are processed through secure third-party payment
                processors
              </li>
              <li>We reserve the right to change our pricing at any time</li>
              <li>
                Refunds are subject to our refund policy and applicable laws
              </li>
              <li>
                You are responsible for any taxes applicable to your
                transactions
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The App and its original content, features, and functionality are
              owned by Tray and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property
              laws. You may not modify, reproduce, distribute, or create
              derivative works based on the App without our express written
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. User Content
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You retain ownership of any content you submit, post, or display
              on the App (&quot;User Content&quot;). By submitting User Content, you grant
              us a worldwide, non-exclusive, royalty-free license to use,
              reproduce, modify, and distribute your User Content for the
              purpose of operating and promoting the App.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You are solely responsible for your User Content and represent
              that you have all necessary rights to grant us the license
              described above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of the App is also governed by our{" "}
              <a
                href="/privacy-policy"
                className="text-green-600 hover:underline"
              >
                Privacy Policy
              </a>
              . Please review our Privacy Policy to understand our practices
              regarding the collection and use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Disclaimers
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
              OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
              TO:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Warranties of merchantability, fitness for a particular purpose,
                or non-infringement
              </li>
              <li>That the App will be uninterrupted, secure, or error-free</li>
              <li>That defects will be corrected</li>
              <li>
                That the App or servers are free of viruses or other harmful
                components
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRAY SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR
              OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE APP.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Indemnification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to defend, indemnify, and hold harmless Tray and its
              officers, directors, employees, and agents from and against any
              claims, liabilities, damages, losses, and expenses, including
              reasonable legal fees, arising out of or in any way connected with
              your use of the App or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Termination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to the App
              immediately, without prior notice or liability, for any reason,
              including if you breach these Terms. Upon termination, your right
              to use the App will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days notice
              prior to any new terms taking effect. Your continued use of the
              App after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              applicable laws, without regard to its conflict of law provisions.
              Any disputes arising from these Terms or your use of the App shall
              be resolved in the appropriate courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              15. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@tray.app
                <br />
                <strong>App:</strong> Tray
                <br />
                <strong>Support:</strong> Available through the app settings
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            By using Tray, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
