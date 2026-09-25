import { useState, useEffect } from 'react';
import Nav from '../../components/Nav';
import './EducationalHelper.css';

export default function EducationalHelper() {
  const [activeTab, setActiveTab] = useState('herbs');
  const [herbsData, setHerbsData] = useState([]);
  const [flavorData, setFlavorData] = useState(null);
  const [herbSearch, setHerbSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredHerbs, setFilteredHerbs] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [herbRes, flavorRes] = await Promise.all([
          fetch('/data/herb-encyclopedia.json'),
          fetch('/data/flavor-science.json')
        ]);
        const herbJson = await herbRes.json();
        const flavorJson = await flavorRes.json();
        setHerbsData(herbJson.encyclopedia.herbs);
        setFlavorData(flavorJson.flavorScience);
        setFilteredHerbs(herbJson.encyclopedia.herbs);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  function searchHerbs() {
    const search = herbSearch.toLowerCase();
    const filtered = herbsData.filter(herb =>
      herb.name.toLowerCase().includes(search) ||
      (herb.commonNames && herb.commonNames.some(n => n.toLowerCase().includes(search)))
    );
    setFilteredHerbs(filtered);
  }

  function applyFilter(filter) {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredHerbs(herbsData);
    } else {
      const filtered = herbsData.filter(herb =>
        herb.magicalProperties.primaryUse.toLowerCase().includes(filter)
      );
      setFilteredHerbs(filtered);
    }
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') searchHerbs();
  }

  return (
    <div className="edu-page">
      <Nav />
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1>Educational Helper</h1>
          <p>Learn about Herbs & Flavor Science for Better Cooking</p>
        </div>

        {/* Tab Navigation */}
        <div className="tabs">
          <button
            className={`tab-btn${activeTab === 'herbs' ? ' active' : ''}`}
            onClick={() => setActiveTab('herbs')}
          >
            Magical Herbs
          </button>
          <button
            className={`tab-btn${activeTab === 'flavor' ? ' active' : ''}`}
            onClick={() => setActiveTab('flavor')}
          >
            Flavor Science
          </button>
          <button
            className={`tab-btn${activeTab === 'guide' ? ' active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            Learning Guide
          </button>
        </div>

        {/* HERBS TAB */}
        <div className={`tab-content${activeTab === 'herbs' ? ' active' : ''}`}>
          <div className="info-box">
            <h2>Cunningham's Encyclopedia of Magical Herbs</h2>
            <p>Discover the magical properties, correspondences, and practical applications of 400+ herbs and plants. Each herb contains unique vibrations and energies that can be harnessed for specific magical purposes. Learn which herbs align with your intentions.</p>
          </div>

          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Search herbs by name..."
                value={herbSearch}
                onChange={e => setHerbSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <button className="search-btn" onClick={searchHerbs}>Search</button>
            </div>
            <div className="filter-buttons">
              {[
                { value: 'all', label: 'All Herbs' },
                { value: 'love', label: 'Love' },
                { value: 'protection', label: 'Protection' },
                { value: 'healing', label: 'Healing' },
                { value: 'prosperity', label: 'Prosperity' },
              ].map(f => (
                <button
                  key={f.value}
                  className={`filter-btn${activeFilter === f.value ? ' active' : ''}`}
                  onClick={() => applyFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="herb-grid">
            {filteredHerbs.map((herb, i) => (
              <div className="herb-card" key={i}>
                <div className="herb-header">
                  <h3>{herb.name}</h3>
                  <p className="herb-scientific">{herb.scientificName}</p>
                </div>
                <div className="herb-body">
                  <div className="herb-properties">
                    <div className="property-label">Primary Use</div>
                    <div className="property-value">{herb.magicalProperties.primaryUse}</div>
                  </div>
                  <div className="herb-properties">
                    <div className="property-label">Powers</div>
                    <div className="property-value">{herb.magicalProperties.powers.join(', ')}</div>
                  </div>
                  <div className="correspondences">
                    <div className="correspondence">
                      <span className="correspondence-label">Element</span>
                      {herb.correspondences.element}
                    </div>
                    <div className="correspondence">
                      <span className="correspondence-label">Planet</span>
                      {herb.correspondences.planet}
                    </div>
                    <div className="correspondence">
                      <span className="correspondence-label">Chakra</span>
                      {herb.correspondences.chakra}
                    </div>
                    <div className="correspondence">
                      <span className="correspondence-label">Zodiac</span>
                      {herb.correspondences.zodiac}
                    </div>
                  </div>
                  <div className="applications">
                    <h4>Magical Applications</h4>
                    <ul className="app-list">
                      {herb.magicalApplications.map((app, j) => (
                        <li key={j}>{app}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FLAVOR SCIENCE TAB */}
        <div className={`tab-content${activeTab === 'flavor' ? ' active' : ''}`}>
          <div className="info-box">
            <h2>Flavor: The Science of Our Most Neglected Sense</h2>
            <p>Understanding flavor science can transform your cooking. Learn how taste, smell, and other senses combine to create flavor. Discover the principles behind flavor pairing, cooking methods, and how to develop your palate for deeper appreciation of food.</p>
          </div>

          <div className="fundamentals-grid">
            {flavorData && flavorData.fundamentals && flavorData.fundamentals.slice(0, 3).map((fundamental, i) => {
              let content = null;
              if (fundamental.tastes) {
                content = fundamental.tastes.map((taste, j) => (
                  <div className="taste-item" key={j}>
                    <div className="taste-name">{taste.taste}</div>
                    <div className="taste-description">{taste.description}</div>
                    <div className="taste-sources"><strong>Sources:</strong> {taste.sources}</div>
                  </div>
                ));
              } else if (fundamental.concepts) {
                content = fundamental.concepts.map((c, j) => (
                  <div className="taste-item" key={j}>
                    <div className="taste-name">{c.concept}</div>
                    <div className="taste-description">{c.explanation}</div>
                  </div>
                ));
              } else if (fundamental.principles) {
                content = fundamental.principles.map((p, j) => (
                  <div className="taste-item" key={j}>
                    <div className="taste-name">{p.principle}</div>
                    <div className="taste-description">{p.rule}</div>
                    <div className="taste-sources"><strong>Example:</strong> {p.example}</div>
                  </div>
                ));
              }
              return (
                <div className="fundamental-card" key={i}>
                  <div className="fundamental-header">
                    <h3>{fundamental.name}</h3>
                  </div>
                  <div className="fundamental-body">
                    <p className="fundamental-description">{fundamental.description}</p>
                    <div className="tastes-grid">{content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LEARNING GUIDE TAB */}
        <div className={`tab-content${activeTab === 'guide' ? ' active' : ''}`}>
          <div className="info-box">
            <h2>How to Use These Educational Resources</h2>
            <p>These resources are designed to deepen your understanding of cooking fundamentals. Whether you're interested in the magical properties of herbs or the science behind flavor, follow these learning paths to master each topic.</p>
          </div>

          <div className="learning-path">
            <h3>Herb Magic Learning Path</h3>
            <div className="path-steps">
              {[
                { num: '1', title: 'Understanding Herb Vibrational Energy', desc: 'Learn that each herb contains unique vibrations matching specific magical needs. Understand correspondences: elements, planets, and chakras.' },
                { num: '2', title: 'Identify Your Magical Need', desc: 'Determine what you need the magic for: love, protection, healing, prosperity, etc. This determines which herbs to select.' },
                { num: '3', title: 'Choose Appropriate Herbs', desc: 'Select herbs whose vibrations match your need. Use the encyclopedia to find herbs with desired properties and correspondences.' },
                { num: '4', title: 'Learn Herb Applications', desc: 'Understand different ways to use herbs: sachets, tea, bath soaks, incense, oil infusions, cooking. Each method has different effects.' },
                { num: '5', title: 'Practice & Experiment', desc: 'Start with simple applications. Work with herbs in loving ways. Track results and build your personal herb knowledge base.' },
              ].map(step => (
                <div className="step" key={step.num}>
                  <div className="step-number">{step.num}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="learning-path">
            <h3>Flavor Science Learning Path</h3>
            <div className="path-steps">
              {[
                { num: '1', title: 'Master the Five Tastes', desc: 'Learn sweet, salty, sour, bitter, and umami. Understand what each taste indicates and which foods contain them.' },
                { num: '2', title: 'Understand Smell-Flavor Connection', desc: 'Discover that 80-90% of flavor comes from smell, not taste buds. Learn orthonasal and retronasal olfaction.' },
                { num: '3', title: 'Learn Flavor Pairing Principles', desc: 'Apply science-based rules: salt inhibits bitter, acid balances richness, umami enhances satisfaction, fat carries flavor.' },
                { num: '4', title: 'Study Cooking Reactions', desc: 'Learn how Maillard reaction, caramelization, and umami development create complex flavors through cooking methods.' },
                { num: '5', title: 'Develop Your Palate', desc: 'Practice tasting techniques. Analyze flavors systematically. Apply principles to your own cooking for immediate improvements.' },
              ].map(step => (
                <div className="step" key={step.num}>
                  <div className="step-number">{step.num}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="learning-path">
            <h3>Integrated Cooking Knowledge</h3>
            <div className="path-steps">
              {[
                { num: '★', title: 'Combine Both Approaches', desc: 'Use herb knowledge for magical and flavor applications. Understand herbs as both magical tools and flavorful ingredients. This integration creates dishes with deeper purpose and resonance.' },
                { num: '★', title: 'Create Intentional Meals', desc: 'Design meals with both magical correspondences and flavor science principles. Select herbs that match your intention while creating balanced, delicious dishes.' },
                { num: '★', title: 'Honor the Craft', desc: 'Cooking becomes a meditative practice combining science and intention. Each meal becomes an act of magic informed by understanding.' },
              ].map((step, i) => (
                <div className="step" key={i}>
                  <div className="step-number">{step.num}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
