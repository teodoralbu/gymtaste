export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#555', fontSize: '13px', marginBottom: '48px' }}>Last updated: March 2026</p>

      <Section title="1. Who we are">
        GymTaste is a supplement flavor rating platform operated by GymTaste. We help gym-goers discover and rate supplement flavors based on real community feedback.
      </Section>

      <Section title="2. What data we collect">
        When you create an account, we collect your email address and username. When you submit ratings or reviews, we store the content you provide. We also collect basic usage data to improve the platform.
      </Section>

      <Section title="3. How we use your data">
        We use your data to operate your account, display your ratings and profile, and improve GymTaste. We do not sell your data to third parties.
      </Section>

      <Section title="4. Who we share data with">
        Your public profile, username, and ratings are visible to all users. We use Supabase for database and authentication services. No other third parties have access to your personal data.
      </Section>

      <Section title="5. Cookies">
        We use cookies solely for authentication purposes — to keep you logged in. We do not use tracking or advertising cookies.
      </Section>

      <Section title="6. Your rights">
        You can delete your account and all associated data at any time from your settings page. You can also request a copy of your data by contacting us.
      </Section>

      <Section title="7. Data retention">
        We retain your data for as long as your account is active. When you delete your account, your personal data is removed within 30 days.
      </Section>

      <Section title="8. Contact">
        For any privacy-related questions, contact us at privacy@gymtaste.com.
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
