export default function TermsPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '48px' }}>Last updated: March 2026</p>

      <Section title="1. Acceptance of terms">
        By using GymTaste, you agree to these Terms of Service. If you do not agree, please do not use the platform.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 13 years old to use GymTaste. By creating an account, you confirm that you meet this requirement.
      </Section>

      <Section title="3. Your account">
        You are responsible for keeping your account credentials secure. You are responsible for all activity that occurs under your account. GymTaste reserves the right to suspend or terminate accounts that violate these terms.
      </Section>

      <Section title="4. User content">
        You retain ownership of the content you post on GymTaste. By posting, you grant GymTaste a non-exclusive license to display your content on the platform. You are responsible for ensuring your content is accurate and does not violate any laws.
      </Section>

      <Section title="5. Prohibited conduct">
        You agree not to post false, misleading, or offensive content. You agree not to spam, harass, or abuse other users. You agree not to attempt to manipulate ratings or exploit the platform.
      </Section>

      <Section title="6. Disclaimer">
        GymTaste is a community review platform. Ratings and reviews reflect the opinions of individual users and do not constitute professional nutritional or medical advice. Always consult a qualified professional before starting any supplement regimen.
      </Section>

      <Section title="7. Limitation of liability">
        GymTaste is provided as-is without any warranties. We are not liable for any damages arising from your use of the platform or reliance on user-submitted content.
      </Section>

      <Section title="8. Changes to terms">
        We may update these terms from time to time. Continued use of GymTaste after changes constitutes acceptance of the new terms.
      </Section>

      <Section title="9. Contact">
        For any questions about these terms, contact us at legal@gymtaste.com.
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '10px', color: '#FFF' }}>{title}</h2>
      <p style={{ color: '#A0A0A0', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  )
}
