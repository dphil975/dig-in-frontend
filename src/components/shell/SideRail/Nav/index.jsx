/* Nav — retired.

   The app's navigation moved from a horizontal top bar to a single vertical
   Tumblr-style sidebar (see components/shell/SideRail), which is now rendered ONCE
   globally in App.jsx. Every page still calls <Nav /> in its own tree, so
   rather than edit ~50 pages this component simply renders nothing — the
   sidebar is the nav now. The site map itself lives in Nav/navConfig.js, still
   imported by the sidebar.

   Kept as a no-op (not deleted) so all the existing `import Nav` / `<Nav />`
   call sites keep working untouched. */
export default function Nav() {
  return null;
}
