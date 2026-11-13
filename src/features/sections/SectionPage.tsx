import { Icon } from '../../components/Icon'
import { StatePanel } from '../../components/StatePanel'
import { AuthPanel } from '../auth/AuthPanel'
import { useAuth } from '../auth/authContext'
import type { AppSection } from '../../components/Navigation'

type SectionPageProps = {
  section: Exclude<AppSection, 'cards'>
}

const sectionTitles: Record<
  Exclude<AppSection, 'cards'>,
  { eyebrow: string; title: string; description: string }
> = {
  video: {
    eyebrow: 'VIDEO',
    title: 'Video library',
    description: 'Approved video content is unavailable until a source is connected.',
  },
  chat: {
    eyebrow: 'SUPPORT',
    title: 'Customer support',
    description: 'Account-based messaging is not connected yet.',
  },
  wallet: {
    eyebrow: 'WALLET',
    title: 'Wallet',
    description: 'Wallet balances and activity require a secure server connection.',
  },
  settings: {
    eyebrow: 'SETTINGS',
    title: 'Account settings',
    description: 'Manage account access and review available privacy controls.',
  },
}

export function SectionPage({ section }: SectionPageProps) {
  const content = sectionTitles[section]
  const { user } = useAuth()

  return (
    <section className={`section-page section-page--${section}`} aria-labelledby="section-title">
      <header className="section-page-header">
        <p className="eyebrow"><span className="eyebrow-line" /> {content.eyebrow}</p>
        <h1 id="section-title">{content.title}</h1>
        <p>{content.description}</p>
      </header>
      {section === 'video' && <VideoSection />}
      {section === 'chat' && <ChatSection isSignedIn={Boolean(user)} />}
      {section === 'wallet' && <WalletSection />}
      {section === 'settings' && <SettingsSection />}
    </section>
  )
}

function VideoSection() {
  return (
    <>
      <div className="journal-intro">
        <div>
          <span className="section-kicker">VIDEO LIBRARY</span>
          <h2>Available videos</h2>
        </div>
        <span className="journal-index">CONTENT SOURCE <i>/</i> NOT CONNECTED</span>
      </div>
      <div className="journal-empty">
        <span className="journal-monogram" aria-hidden="true">B<span>X</span></span>
        <StatePanel
          kind="empty"
          title="Video is unavailable"
          description="No published videos are available. An approved content source must be connected before playback can be offered."
          icon={<Icon name="clapperboard" size={20} strokeWidth={1.6} />}
        />
      </div>
    </>
  )
}

function ChatSection({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="support-layout">
      <div className="support-card support-card--primary">
        <span className="support-symbol"><Icon name="message-circle" size={22} /></span>
        <span className="section-kicker">PRIVATE · ACCOUNT-BASED</span>
        <h2>Support messaging unavailable</h2>
        <p>
          {isSignedIn
            ? 'Your account is signed in, but support messaging is not yet connected. No message can be sent or stored here.'
            : 'Sign in to prepare for a private support conversation. Messaging is not yet connected, so nothing can be sent or stored here.'}
        </p>
        <span className="connection-state">
          <span className="connection-indicator" />
          {isSignedIn ? 'Messaging not connected' : 'Sign-in required'}
        </span>
        <button type="button" className="section-disabled-button" disabled>
          <Icon name="lock-keyhole" size={15} />
          {isSignedIn ? 'Not connected' : 'Sign-in required'}
        </button>
      </div>
      <aside className="support-side-note">
        <span className="section-kicker">YOUR PRIVACY</span>
        <h3>Messaging is not connected</h3>
        <p>
          No messages are being collected. Once connected, support conversations
          must be visible only to you and authorized support staff.
        </p>
        <div className="privacy-rule" />
        <span><Icon name="shield-check" size={15} /> Private by design</span>
      </aside>
    </div>
  )
}

function WalletSection() {
  const { user } = useAuth()

  return (
    <>
      <div className="wallet-card">
        <div className="wallet-card-top">
          <span className="wallet-logo">BX<span>®</span></span>
          <span className="wallet-card-label">ACCOUNT WALLET</span>
          <Icon name="shield-check" size={18} />
        </div>
        <span className="wallet-balance-label">AVAILABLE BALANCE</span>
        <strong className="wallet-balance-value">Not available</strong>
        <span className="wallet-login-note">
          <Icon name="lock-keyhole" size={13} />
          {user ? 'Wallet account data is not connected yet' : 'Sign in to securely view your balance'}
        </span>
        <span className="wallet-card-orbit wallet-card-orbit--one" />
        <span className="wallet-card-orbit wallet-card-orbit--two" />
      </div>
      <div className="wallet-activity-heading">
        <div>
          <span className="section-kicker">ACCOUNT ACTIVITY</span>
          <h2>Recent transactions</h2>
        </div>
        <span className="private-label"><Icon name="lock-keyhole" size={13} /> PRIVATE</span>
      </div>
      <StatePanel
        kind="empty"
        title="No account activity to show"
        description={user
          ? 'Wallet services are not connected yet. No balance or transactions are simulated here.'
          : 'Transaction history is available only after secure sign-in. No balance or transactions are simulated here.'}
        icon={<Icon name="arrow-right" size={19} />}
      />
    </>
  )
}

function SettingsSection() {
  const { user } = useAuth()
  const settings = [
    {
      icon: 'user' as const,
      title: 'Personal information',
      description: 'Profile details and account identity',
      status: user ? 'NOT CONNECTED' : 'SIGN-IN REQUIRED',
    },
    {
      icon: 'bell' as const,
      title: 'Notifications',
      description: 'Choose which updates reach you',
      status: 'NOT CONNECTED',
    },
    {
      icon: 'lock-keyhole' as const,
      title: 'Privacy & security',
      description: 'Sessions, access and data preferences',
      status: user ? 'NOT CONNECTED' : 'SIGN-IN REQUIRED',
    },
    {
      icon: 'message-circle' as const,
      title: 'Help & support',
      description: 'Get help with your account or an order',
      status: user ? 'NOT CONNECTED' : 'SIGN-IN REQUIRED',
    },
  ]

  return (
    <div className="settings-layout">
      <AuthPanel />
      <div className="settings-profile">
        <span className="settings-avatar">
          {(user?.email?.[0] ?? 'B').toUpperCase()}
        </span>
        <div>
          <span className="section-kicker">CURRENT SESSION</span>
          <h2>{user?.email ?? 'Guest account'}</h2>
          <p>
            {user
              ? 'Authenticated account. Profile editing is not connected yet.'
              : 'No profile details are collected while browsing as a guest.'}
          </p>
        </div>
        <span className="guest-badge">{user ? 'ACCOUNT' : 'GUEST'}</span>
      </div>
      <div className="settings-list" aria-label="Account settings">
        {settings.map(({ icon, title, description, status }) => (
          <div className="settings-row" key={title}>
            <span className="settings-row-icon"><Icon name={icon} size={18} /></span>
            <div className="settings-row-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <span className="settings-row-status">{status}</span>
          </div>
        ))}
      </div>
      <p className="settings-footnote">
        <Icon name="shield-check" size={15} />
        Authentication is connected when Supabase is configured; profile editing and notification controls are not connected yet.
      </p>
    </div>
  )
}
