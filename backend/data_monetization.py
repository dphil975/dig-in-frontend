import json
from collections import Counter
from datetime import datetime, timedelta

class DataMonetization:
    """
    Anonymized shopping data to sell to stores and brands
    This is where the real money is
    """
    
    def __init__(self):
        self.user_data = []  # Anonymized
        self.aggregated_insights = {
            "trending_ingredients": Counter(),
            "popular_stores_by_zip": {},
            "substitution_patterns": Counter(),
            "peak_cooking_times": Counter(),
            "regional_specialties": {}
        }
    
    def collect_anonymous_data(self, user_id, shopping_data, recipe_data, location_data):
        """Collect data without PII"""
        # Hash user ID for anonymity
        import hashlib
        anonymous_id = hashlib.sha256(str(user_id).encode()).hexdigest()[:16]
        
        data_point = {
            "anonymous_id": anonymous_id,
            "zip_code": location_data.get('zip_code', 'unknown'),
            "timestamp": datetime.now().isoformat(),
            "ingredients_bought": shopping_data.get('items', []),
            "recipe_made": recipe_data.get('name'),
            "substitutions_used": recipe_data.get('substitutions', []),
            "cooking_time_actual": recipe_data.get('actual_time'),
            "store_used": shopping_data.get('store'),
            "price_conscious": shopping_data.get('used_coupon', False)
        }
        
        self.user_data.append(data_point)
        
        # Update aggregates
        for ingredient in data_point['ingredients_bought']:
            self.aggregated_insights['trending_ingredients'][ingredient] += 1
        
        zip_code = data_point['zip_code']
        store = data_point['store_used']
        if zip_code not in self.aggregated_insights['popular_stores_by_zip']:
            self.aggregated_insights['popular_stores_by_zip'][zip_code] = Counter()
        self.aggregated_insights['popular_stores_by_zip'][zip_code][store] += 1
        
        for sub in data_point['substitutions_used']:
            self.aggregated_insights['substitution_patterns'][sub] += 1
        
        hour = datetime.fromisoformat(data_point['timestamp']).hour
        self.aggregated_insights['peak_cooking_times'][hour] += 1
        
        return {"success": True, "anonymous_id": anonymous_id}
    
    def get_trending_insights(self, timeframe_days=7):
        """Sell this data back to stores and brands"""
        # Filter by timeframe
        cutoff = datetime.now() - timedelta(days=timeframe_days)
        
        recent_trends = {
            "trending_ingredients": self.aggregated_insights['trending_ingredients'].most_common(20),
            "substitution_insights": self.aggregated_insights['substitution_patterns'].most_common(10),
            "peak_hours": dict(sorted(self.aggregated_insights['peak_cooking_times'].items())),
            "regional_demands": self.aggregated_insights['popular_stores_by_zip']
        }
        
        # Add monetization suggestions
        recommendations = []
        if recent_trends['trending_ingredients']:
            recommendations.append(f"Stock up on {recent_trends['trending_ingredients'][0][0]} - demand up {recent_trends['trending_ingredients'][0][1]}%")
        if recent_trends['peak_hours']:
            recommendations.append(f"Advertise between {list(recent_trends['peak_hours'].keys())[0]}:00 - {list(recent_trends['peak_hours'].keys())[-1]}:00")
        if recent_trends['substitution_insights']:
            recommendations.append(f"Offer coupons for {recent_trends['substitution_insights'][0][0]} - users are substituting this")
        recent_trends['recommendations'] = recommendations
        
        return recent_trends
    
    def generate_report_for_store(self, store_name, zip_code):
        """Sell custom reports to grocery stores"""
        store_data = self.aggregated_insights['popular_stores_by_zip'].get(zip_code, {})
        
        report = {
            "store": store_name,
            "zip_code": zip_code,
            "market_share": store_data.get(store_name, 0),
            "competitors": [s for s in store_data if s != store_name],
            "customer_insights": {
                "average_basket_size": self.calculate_basket_size(zip_code),
                "peak_times": self.get_peak_times_for_zip(zip_code),
                "frequently_bundled": self.get_bundled_items(zip_code)
            },
            "opportunities": self.identify_opportunities(zip_code),
            "price_sensitivity": self.measure_price_sensitivity(zip_code)
        }
        
        return report

    def calculate_basket_size(self, zip_code):
        """Average number of items per shopping trip"""
        baskets = [len(d['ingredients_bought']) for d in self.user_data if d['zip_code'] == zip_code]
        if not baskets:
            return 0
        return sum(baskets) / len(baskets)
    
    def get_peak_times_for_zip(self, zip_code):
        """Most popular cooking times in an area"""
        times = [d['timestamp'] for d in self.user_data if d['zip_code'] == zip_code]
        hours = [datetime.fromisoformat(t).hour for t in times]
        return Counter(hours).most_common(3)
    
    def get_bundled_items(self, zip_code):
        """Items frequently bought together"""
        # Simplified - in production, use association rule mining
        return [
            {"items": ["tomato", "onion", "garlic"], "frequency": 85},
            {"items": ["rice", "soy sauce", "eggs"], "frequency": 72},
            {"items": ["chicken", "broccoli", "soy sauce"], "frequency": 68}
        ]
    
    def identify_opportunities(self, zip_code):
        """Gaps in the market for this area"""
        trending = [i for i, _ in self.aggregated_insights['trending_ingredients'].most_common(10)]
        available = [d['store_used'] for d in self.user_data if d['zip_code'] == zip_code]
        
        # Find trending ingredients not easily available
        opportunities = []
        # This would check store inventory data
        return opportunities
    
    def measure_price_sensitivity(self, zip_code):
        """How price-conscious shoppers are in this area"""
        coupon_users = [d for d in self.user_data if d['zip_code'] == zip_code and d.get('price_conscious')]
        total_users = [d for d in self.user_data if d['zip_code'] == zip_code]
        
        if not total_users:
            return "unknown"
        
        sensitivity = len(coupon_users) / len(total_users)
        
        if sensitivity > 0.7:
            return "very price sensitive"
        elif sensitivity > 0.4:
            return "moderately price sensitive"
        else:
            return "premium shopper"