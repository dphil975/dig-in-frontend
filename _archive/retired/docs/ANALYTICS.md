# 📊 Dig In Analytics & Tracking System

## Overview
Comprehensive analytics system that tracks user engagement, recipe interactions, and app usage patterns. Essential for demonstrating traction to VCs and understanding user behavior.

---

## 🎯 Key Metrics Tracked

### User Metrics
- **User ID** - Unique identifier for each user (persisted across sessions)
- **Session ID** - Unique identifier for current session
- **Session Duration** - Total time spent in app
- **Page Views** - Total navigations within app

### Recipe Engagement
- **Recipes Viewed** - Total unique recipes browsed
- **Recipes Liked** - Total recipes saved as favorites
- **Like Rate** - % of viewed recipes that are liked
- **Recipe Completion Rate** - % of steps completed in cooking mode

### Search & Discovery
- **Search Queries** - Total searches performed
- **Unique Searches** - Number of distinct search terms
- **Search Results** - Results returned per search
- **Search Success Rate** - Searches with results vs empty

### Navigation Behavior
- **Filter Usage** - Country and category filters applied
- **Shuffle Clicks** - Random recipe discoveries
- **Pagination** - How many pages users browse
- **Time per Recipe** - Average time spent viewing each recipe

### Feature Usage
- **View Steps** - Number of times detailed cooking view opened
- **All Drinks** - Drink pairing views
- **Adapt Recipe** - Recipe customization clicks
- **Print/Save** - Export functionality usage

### Engagement Score
- **0-100 scale** calculated from:
  - Views: 30 points max
  - Likes: 30 points max
  - Searches: 20 points max
  - Session Time: 20 points max

---

## 📈 Analytics Dashboard

### Access
```
http://localhost:8000/analytics-dashboard.html
```

### Dashboard Features

**Key Metrics Cards**
- Session duration
- Recipes viewed
- Recipes liked
- Page views
- Search queries
- Engagement score with visual bar

**Recent Activity Log**
- Last 20 tracked events
- Event name, timestamp, and data
- Real-time updates

**Detailed Statistics**
- Total events count
- User ID (for tracking)
- Session ID (for debugging)
- Event frequency breakdown

**User Lists**
- Liked recipes (top 10)
- Recently viewed recipes
- Recent search queries
- Top events by frequency

**Action Buttons**
- 🔄 Refresh - Update dashboard manually
- 💾 Export Data - Download analytics as JSON
- 🗑️ Clear Data - Reset all local analytics
- 🍽️ Back to App - Return to recipe browser

---

## 📝 Tracked Events

### User Events

#### `page_view`
Triggered when user loads a page
```javascript
{
    page_path: "/recipe-cards-premium.html",
    page_title: "Dig In - Premium Recipe Cards",
    page_views: 1
}
```

#### `recipe_view`
Triggered when recipe card is displayed
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    country: "Argentina",
    category: "breakfast",
    total_recipes_viewed: 5
}
```

#### `recipe_like`
Triggered when user clicks favorite heart
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    action: "liked" | "unliked",
    total_likes: 3
}
```

#### `recipe_search`
Triggered when user searches for recipes
```javascript
{
    search_query: "ramen",
    results_count: 12,
    unique_searches: 3
}
```

#### `filter_usage`
Triggered when user applies country/category filter
```javascript
{
    filter_type: "country" | "category" | "search",
    filter_value: "Italy",
    results_found: 7
}
```

#### `view_steps`
Triggered when user clicks "VIEW STEPS"
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    action: "opened_detailed_steps"
}
```

#### `adapt_recipe`
Triggered when user clicks adapt button
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    adapt_type: "+Protein" | "+Fiber" | "Lower Carbs" | "+Veggies",
    action: "opened_customization"
}
```

#### `step_completed`
Triggered when user marks a cooking step complete
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    step_number: 3,
    total_steps: 5,
    completion_percentage: 60
}
```

#### `recipe_completed`
Triggered when all steps are completed
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    time_spent_seconds: 1245
}
```

#### `recipe_shuffle`
Triggered when user clicks shuffle button
```javascript
{
    action: "user_clicked_shuffle"
}
```

#### `view_all_drinks`
Triggered when user clicks "ALL DRINKS"
```javascript
{
    recipe_id: "arg-break-medialunas",
    recipe_name: "Medialunas",
    category: "breakfast"
}
```

---

## 💾 Data Storage

### Local Storage
Analytics data stored in browser's local storage:
- `dig_in_user_id` - User identifier (persists across sessions)
- `dig_in_session_metrics` - Current session metrics
- `dig_in_events` - Last 100 tracked events

### Export
Download all analytics as JSON file:
1. Click **💾 EXPORT DATA** on dashboard
2. File saved as `dig-in-analytics-[timestamp].json`
3. Contains complete event history, metrics, and user data

---

## 🔗 Google Analytics Integration

### Setup
1. Create Google Analytics 4 property
2. Get your GA ID (format: G-XXXXXXXXXX)
3. Replace GA ID in `analytics-tracker.js`:
   ```javascript
   script.src = 'https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID';
   gtag('config', 'G-YOUR-ID', {...});
   ```

### View in Google Analytics
- Real-time user activity
- Event tracking
- Engagement metrics
- Session duration
- Custom events

---

## 📊 Metrics for VC Pitch

### Essential Metrics to Highlight

**Growth Metrics**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio (stickiness)
- Week-over-week growth

**Engagement Metrics**
- Average session duration
- Recipes viewed per session
- Like rate (favorites per recipe viewed)
- Search frequency
- Feature adoption rates

**Retention Metrics**
- Day 1, Day 7, Day 30 retention
- Repeat usage rate
- Return user percentage

**Monetization Readiness**
- Time spent in app
- Feature usage patterns
- Premium feature interest
- User segment breakdown

---

## 🚀 Using Analytics in Pitch Deck

### Slide 1: Traction Metrics
```
📊 User Engagement
• XXX daily active users
• XX minute average session
• XXX recipes viewed/user/day
• XX% like rate (high engagement!)
```

### Slide 2: Growth Trajectory
```
📈 30-Day Growth
• Week 1: XXX DAU
• Week 2: XXX DAU (+XX%)
• Week 3: XXX DAU (+XX%)
• Week 4: XXX DAU (+XX%)
```

### Slide 3: Feature Adoption
```
🎯 Feature Usage
• 65% use search
• 42% save favorites
• 38% view cooking steps
• 25% customize recipes
```

### Slide 4: Engagement Score
```
💪 User Engagement Score
• Average: XX/100
• Active users: XX/100
• Highly engaged: XX/100
```

---

## 🔍 How to Use for VC Fundraising

### Week 1-2: Baseline
1. Set up analytics
2. Invite 10-20 friends/beta users
3. Collect 2 weeks of data
4. Document engagement metrics

### Week 3-4: Growth Push
1. Target 50+ users
2. Measure growth rate
3. Identify feature adoption patterns
4. Refine value proposition

### Week 5-6: Pitch Preparation
1. Export complete analytics
2. Create charts showing:
   - User growth trajectory
   - Engagement metrics
   - Retention curves
   - Feature adoption
3. Calculate CAC (Customer Acquisition Cost)
4. Project 6-month and 1-year growth

### Pitch Meeting
```
"Our analytics show:
• Average user spends 12 minutes per session
• 45% like/save recipes (high engagement)
• Users complete 3.2 recipes/week
• 2-week retention rate: 62%
• DAU growing 15% week-over-week"
```

---

## 📱 Mobile & Device Tracking

Current setup tracks:
- Session duration
- User ID persistence
- All events
- Browser/device info (via Google Analytics)

Future enhancements:
- Device type (mobile vs desktop)
- Operating system
- Screen size
- Network type
- Geographic location

---

## 🔐 Privacy & Compliance

### Current Implementation
- No personal data collected
- Anonymous user IDs
- Local storage only
- No server transmission (yet)

### GDPR Compliance (When Needed)
- Add cookie consent banner
- Allow data deletion
- Privacy policy
- Terms of service
- Transparent tracking disclosure

---

## 💡 Tips for Analytics Success

### Best Practices
1. **Regular Review** - Check dashboard daily to monitor engagement
2. **Set Baselines** - Document initial metrics for comparison
3. **Track Cohorts** - Monitor new vs returning users separately
4. **Watch Drop-offs** - Identify where users leave
5. **A/B Test** - Compare design changes with metrics
6. **Share Metrics** - Keep team aligned on goals

### Common Issues
- **Low engagement** → Simplify UX, add onboarding
- **High abandonment** → Check if recipes are incomplete
- **Few searches** → Improve discoverability
- **Low likes** → Reduce friction in save flow

---

## 🎓 Analytics API Reference

### Global Instance
```javascript
// Access analytics anywhere
window.digInAnalytics
```

### Key Methods

```javascript
// Track recipe view
digInAnalytics.trackRecipeView(id, name, country, category);

// Track like/favorite
digInAnalytics.trackRecipeLike(id, name, liked);

// Track search
digInAnalytics.trackRecipeSearch(query, resultsCount);

// Track filter
digInAnalytics.trackFilterUsage(type, value, results);

// Track steps view
digInAnalytics.trackViewSteps(id, name);

// Track adapt
digInAnalytics.trackAdaptRecipe(id, name, adaptType);

// Track step completion
digInAnalytics.trackStepCompletion(id, name, step, total);

// Track recipe completion
digInAnalytics.trackRecipeCompletion(id, name, timeSpent);

// Get all metrics
digInAnalytics.getSessionMetrics();

// Get dashboard data
digInAnalytics.getDashboardData();

// Export data
digInAnalytics.exportData();

// Get engagement score (0-100)
digInAnalytics.getEngagementScore();
```

---

## 📊 Sample Dashboard Output

```
┌─────────────────────────────────────────────────────┐
│ DIG IN ANALYTICS DASHBOARD                          │
├─────────────────────────────────────────────────────┤
│
│ SESSION DURATION        RECIPES VIEWED       LIKES
│       12m 34s                 8                3
│
│ PAGE VIEWS         SEARCHES              ENGAGEMENT
│        15              4                  68/100
│
│ ─────────────────────────────────────────────────────
│ RECENT ACTIVITY
│ ├─ 12:34:56  recipe_view  (Carbonara)
│ ├─ 12:33:12  filter_usage (Country: Italy)
│ ├─ 12:32:45  recipe_search (pasta)
│ ├─ 12:31:20  recipe_like (Carbonara - LIKED)
│ └─ 12:30:00  page_view
│
│ LIKED RECIPES          VIEWED RECIPES
│ • Carbonara            • Carbonara
│ • Pad Thai             • Ramen
│ • Shakshuka            • Shakshuka
│
│ ACTIONS
│ [🔄 REFRESH]  [💾 EXPORT]  [🗑️ CLEAR]  [🍽️ APP]
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Deploy Analytics** ✅ Done
2. **Gather 2 Weeks Data** - Collect baseline metrics
3. **Analyze Patterns** - Identify user behaviors
4. **Optimize Features** - Improve based on usage data
5. **Create Pitch Metrics** - Prepare VC presentation
6. **Iterate & Improve** - Use data to refine app

---

**Version**: 1.0  
**Created**: June 17, 2026  
**Status**: Production Ready ✅  
**Integration**: Embedded in recipe-cards-premium.html  
**Dashboard**: analytics-dashboard.html  
**Export Format**: JSON
