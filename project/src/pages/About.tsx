import { Mail, Heart, Database, Shield, Users } from 'lucide-react';

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About Fulton Care Connect</h1>

      <section className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <Heart className="w-8 h-8 text-[#2563eb] flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Fulton Care Connect is dedicated to connecting Fulton County residents with free and
              low-cost community resources. We believe that everyone deserves access to essential
              services including food, housing, healthcare, mental health support, transportation,
              and employment assistance.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our comprehensive directory makes it easy to find help when you need it most, whether
              you're searching by location, category, or specific need. We're committed to keeping
              our information current and accessible to all members of our community.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <Database className="w-8 h-8 text-[#2563eb] flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sources</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our directory is built from trusted sources including:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#2563eb] font-bold">•</span>
                <span><strong>SKYE:</strong> Supporting Kids & Youth with Essential services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2563eb] font-bold">•</span>
                <span><strong>FACAA:</strong> Fulton Atlanta Community Action Authority</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2563eb] font-bold">•</span>
                <span><strong>DFCS:</strong> Georgia Division of Family and Children Services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2563eb] font-bold">•</span>
                <span><strong>Community Partners:</strong> Local organizations and service providers</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We continuously work to verify and update our listings to ensure accuracy. Resources
              are regularly reviewed and updated based on information from service providers and
              community feedback.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <Shield className="w-8 h-8 text-[#fb923c] flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Disclaimer</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-gray-800 font-medium mb-2">
                This directory is provided for informational purposes only.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                While we strive to maintain accurate and current information, service details may
                change without notice. Always call providers directly to confirm:
              </p>
              <ul className="mt-2 ml-6 text-sm text-gray-700 list-disc space-y-1">
                <li>Operating hours and availability</li>
                <li>Eligibility requirements</li>
                <li>Services offered</li>
                <li>Documentation needed</li>
                <li>Location and contact information</li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">
              Fulton Care Connect does not endorse or guarantee the quality of services provided
              by listed organizations. We are not responsible for any actions taken based on
              information found in this directory. In case of emergency, always call 911.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <Users className="w-8 h-8 text-[#2563eb] flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use This Directory</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Browse by Category</h3>
                <p className="text-sm">
                  Click on category buttons to see all resources in that area (Food, Housing,
                  Healthcare, etc.).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ask AI for Help</h3>
                <p className="text-sm">
                  Use our AI assistant to describe what you need in your own words, and it will
                  search the directory for matching resources.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">View Resource Details</h3>
                <p className="text-sm">
                  Click on any resource to see full details including address, phone number,
                  hours, eligibility requirements, and website.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] rounded-lg shadow-md p-8 text-white">
        <div className="flex items-start gap-4">
          <Mail className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="leading-relaxed mb-4">
              We welcome your feedback and suggestions for improving Fulton Care Connect. If you
              know of a resource that should be added to our directory, or if you notice outdated
              information, please let us know.
            </p>
            <a
              href="mailto:info@fultoncareconnect.org"
              className="inline-flex items-center gap-2 bg-white text-[#2563eb] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5" />
              info@fultoncareconnect.org
            </a>
          </div>
        </div>
      </section>

      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>
          Fulton Care Connect is a community service project dedicated to improving access to
          essential resources in Fulton County, Georgia.
        </p>
        <p className="mt-2">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
