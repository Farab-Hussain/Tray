import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Tray",
  description: "Privacy Policy for Tray application",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Tray (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to
              protecting your privacy and ensuring you have a positive
              experience on our application. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our mobile application and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              2.1 Personal Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may collect personal information that you provide directly to
              us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Name and contact information (email address, phone number)
              </li>
              <li>Account credentials (email, password)</li>
              <li>
                Profile information (profile picture, bio, professional details)
              </li>
              <li>
                Payment information (processed securely through third-party
                payment processors)
              </li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              2.2 Automatically Collected Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you use our application, we may automatically collect certain
              information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Device information (device type, operating system, unique device
                identifiers)
              </li>
              <li>Usage data (features accessed, time spent, interactions)</li>
              <li>Location information (if you grant permission)</li>
              <li>Log data (IP address, access times, app crashes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>
                Detect, prevent, and address technical issues and fraudulent
                activity
              </li>
              <li>Personalize your experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Information Sharing and Disclosure
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not sell your personal information. We may share your
              information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Service Providers:</strong> We may share information
                with third-party service providers who perform services on our
                behalf (e.g., payment processing, analytics, cloud hosting)
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information
                if required by law or in response to valid requests by public
                authorities
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with any
                merger, sale, or acquisition of assets
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share information
                with your explicit consent
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security
              measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. However, no method
              of transmission over the Internet or electronic storage is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Your Rights and Choices
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Depending on your location, you may have certain rights regarding
              your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Access:</strong> Request access to your personal
                information
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                information (see our{" "}
                <a
                  href="/delete-user-data"
                  className="text-green-600 hover:underline"
                >
                  Data Deletion Instructions
                </a>
                )
              </li>
              <li>
                <strong>Portability:</strong> Request a copy of your data in a
                portable format
              </li>
              <li>
                <strong>Opt-out:</strong> Opt-out of certain data collection or
                processing
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us using the information
              provided in the &quot;Contact Us&quot; section below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our application may contain links to third-party websites or
              services. We are not responsible for the privacy practices of
              these third parties. We encourage you to review their privacy
              policies before providing any information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If you believe we have collected information from a child
              under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the &quot;Last updated&quot; date. You are advised to
              review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy
              practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@tray.app
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
            By using Tray, you acknowledge that you have read and understood
            this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
