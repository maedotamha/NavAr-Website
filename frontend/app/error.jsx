'use client';

export default function ErrorPage({ error, reset }){
  return <main className="errorPage">
    <section className="errorCard">
      <span>NavAR</span>
      <h1>Something went wrong</h1>
      <p>{error?.message || 'The admin console hit an unexpected error.'}</p>
      <button onClick={reset}>Try again</button>
    </section>
  </main>;
}
