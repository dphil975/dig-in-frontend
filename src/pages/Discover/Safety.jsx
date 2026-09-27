import { useNavigate } from 'react-router-dom';
import Section from './Section';
import { RecallWatch, GrowAndRegrow, CommunityTips } from '../../components/health/FreshPanel';

/* Discover → Safety — keeping what you eat safe, fresh, and stretched.
   Recall Watch first (it's live FDA data); growing and community tips tucked
   behind their headers; "use it up" lives in your Pantry, one tap away. */
export default function Safety({ onWrite }) {
  const navigate = useNavigate();
  return (
    <Section id="safety" title="Safety" sub="Recalls to know about, food you can grow, and tips from people like you.">
      <RecallWatch />
      <GrowAndRegrow collapsible />
      <button type="button" className="dsc-link" onClick={() => navigate('/pantry')}>
        Something about to turn? Use it up first — in your Pantry →
      </button>
      <CommunityTips collapsible onWrite={onWrite} />
    </Section>
  );
}
