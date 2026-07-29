"use client";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-600 mb-6">
              Have questions or feedback about Debate? We'd love to hear from you.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href="mailto:support@debate-app.com"
                  className="text-primary-600 hover:text-primary-700 transition-colors">
                  support@debate-app.com
                </a>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Response time</h3>
                <p className="text-gray-600">We'll get back to you within 24 hours.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Report an issue</h3>
                <p className="text-gray-600">
                  For technical problems or to report inappropriate behavior,
                  use the in-app report button or email us directly.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
