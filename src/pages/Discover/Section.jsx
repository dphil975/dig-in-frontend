/* One titled section of the Discover page. The id is what the jump bar scrolls to. */
export default function Section({ id, title, sub, children }) {
  return (
    <section className="dsc-sec" id={`discover-${id}`} aria-labelledby={`discover-${id}-h`}>
      <header className="dsc-sec-head">
        <h2 className="dsc-sec-title" id={`discover-${id}-h`}>{title}</h2>
        {sub && <p className="dsc-sec-sub">{sub}</p>}
      </header>
      <div className="dsc-sec-body">{children}</div>
    </section>
  );
}
