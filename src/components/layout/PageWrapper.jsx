import { SiteHeader } from './SiteHeader'
import { BottomNav } from './BottomNav'

export function PageWrapper({ children, className = '', showBottomNav = false }) {
  return (
    <div
      className="min-h-dvh"
      style={{
        background:
          'radial-gradient(1200px 520px at 50% -12%, rgba(79,110,247,0.12), transparent 58%), var(--bg-base)',
      }}
    >
      <SiteHeader />
      <div
        className={`mx-auto w-full max-w-lg px-4 pt-5 safe-pt sm:px-5 lg:max-w-7xl lg:px-8 lg:pt-6 ${
          showBottomNav ? 'pb-28 safe-pb lg:pb-10' : 'pb-10'
        } ${className}`}
      >
        {children}
      </div>
      {showBottomNav ? (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      ) : null}
    </div>
  )
}
