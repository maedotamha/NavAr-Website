import Link from 'next/link';

export default function NotFoundPage(){
  return <main className="errorPage">
    <section className="errorCard">
      <span>404</span>
      <h1>Page not found</h1>
      <p>The page you opened does not exist in the NavAR admin console.</p>
      <Link href="/">Return home</Link>
    </section>
  </main>;
}
