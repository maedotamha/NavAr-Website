import Link from 'next/link';

export default function LandingPage(){
  return <main className="landingPage">
    <section className="landingHero">
      <nav className="landingNav">
        <div className="landingBrand"><strong>NavAR</strong><span>Indoor AR Navigation</span></div>
        <div><Link className="landingPrimary" href="/login">Sign in</Link></div>
      </nav>
      <div className="landingHeroGrid">
        <div className="landingCopy">
          <span className="landingEyebrow">AASTU RTC/RD campus operations</span>
          <h1>Command the indoor AR layer of a living campus.</h1>
          <p>NavAR brings QR anchors, route intelligence, Unity mobile sync, user management, and role based permissions into one operational console.</p>
          <div className="landingActions"><Link className="landingPrimary" href="/login">Sign in</Link></div>
          <div className="landingMetrics">
            <span><b>8</b> campus blocks</span>
            <span><b>191</b> QR anchors</span>
            <span><b>93%</b> route success</span>
          </div>
        </div>
        <aside className="landingAccessCard" aria-label="Access control preview">
          <span>Access model</span>
          <strong>Users, roles, modules, and actions</strong>
          <div><b>Admin</b><small>Full platform access</small></div>
          <div><b>Facility Manager</b><small>Facilities, maps, QR anchors, routes</small></div>
          <div><b>Analytics Viewer</b><small>Dashboard and analytics only</small></div>
        </aside>
      </div>
    </section>
    <section className="landingBands">
      <article><i className="bandIcon roleIcon"></i><strong>Role aware admin</strong><span>Grant access by module and action, from read-only analytics to full platform control.</span></article>
      <article><i className="bandIcon mapIcon"></i><strong>Campus map intelligence</strong><span>Inspect active blocks, routes, QR anchors, and AR session health in a focused operational view.</span></article>
      <article><i className="bandIcon syncIcon"></i><strong>Mobile API ready</strong><span>Keep Unity/mobile navigation clients synced with nodes, routes, markers, and session data.</span></article>
    </section>
    <section className="landingShowcase">
      <div>
        <span className="landingEyebrow">Operational layers</span>
        <h2>Built for the messy middle between buildings, people, and live AR positioning.</h2>
      </div>
      <div className="showcaseGrid">
        <article><b>01</b><strong>Permission matrix</strong><p>Create modules and actions, then grant them cleanly to roles.</p></article>
        <article><b>02</b><strong>Navigation quality</strong><p>Spot recovery events, weak QR zones, and route performance changes.</p></article>
        <article><b>03</b><strong>Route telemetry</strong><p>Track success, duration, accuracy, and session recovery trends.</p></article>
        <article><b>04</b><strong>Mobile handoff</strong><p>Keep Unity clients aligned with authoritative navigation data.</p></article>
      </div>
    </section>
  </main>;
}
