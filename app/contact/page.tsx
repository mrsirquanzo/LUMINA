import { Metadata } from "next";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";
import { generateSEO } from "@/components/layout/SEO";

export const metadata: Metadata = generateSEO({
  title: "Contact Quan Ho",
  description: "Get in touch to discuss biotech investment opportunities, due diligence collaborations, or career opportunities in BD/PE/VC.",
  keywords: ["contact", "biotech investor", "investment opportunities", "due diligence"],
});

export default function ContactPage() {
  return (
    <>
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Let's Connect
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Interested in discussing biotech investments, technical due diligence,
            or career opportunities? I'd love to hear from you.
          </p>
        </div>
      </Section>

      <Section background="white">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            {/* Contact Methods */}
            <div className="space-y-6 mb-8">
              {/* LinkedIn */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">LinkedIn</h3>
                  <p className="text-gray-700 mb-2">Best for professional inquiries and networking</p>
                  <Button
                    href="https://www.linkedin.com/in/quan-ho"
                    external
                    variant="primary"
                    className="text-sm"
                  >
                    Connect on LinkedIn
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-700 mb-2">For detailed discussions and collaborations</p>
                  <a
                    href="mailto:hoquan12@gmail.com"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    hoquan12@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Location & Availability */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Status
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Based in Boston, MA</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-accent-700 font-semibold">Available Immediately</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                  <span>Open to relocation</span>
                </div>
              </div>
            </div>
          </div>

          {/* What to Expect */}
          <div className="mt-8 bg-primary-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              What to Expect
            </h3>
            <p className="text-gray-700">
              I typically respond within 24-48 hours. Feel free to reach out about:
            </p>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Investment opportunities in biotech
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Technical due diligence collaborations
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                BD, PE, or VC career opportunities
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Speaking engagements or advisory roles
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
