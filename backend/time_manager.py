import time
import threading
from datetime import datetime, timedelta

class CookingTimer:
    """
    Teaches time management while cooking
    Like having a sous chef
    """
    
    def __init__(self):
        self.active_timers = []
        self.time_log = []
    
    def create_timeline(self, recipe):
        """Create a timed cooking timeline"""
        steps = recipe['flashcards']
        timeline = []
        
        current_time = datetime.now()
        
        for i, step in enumerate(steps):
            estimated_minutes = self.estimate_step_time(step)
            timeline.append({
                "step": i + 1,
                "instruction": step,
                "duration_minutes": estimated_minutes,
                "start_at": current_time + timedelta(minutes=sum(t['duration_minutes'] for t in timeline)),
                "tip": self.get_time_saving_tip(step)
            })
        
        return {
            "total_time": sum(t['duration_minutes'] for t in timeline),
            "timeline": timeline,
            "parallel_tasks": self.identify_parallel_tasks(timeline)
        }
    
    def estimate_step_time(self, step_instruction):
        """Estimate time for each cooking step"""
        keywords = {
            "simmer": 15,
            "boil": 10,
            "fry": 8,
            "stir-fry": 6,
            "bake": 25,
            "roast": 20,
            "grill": 12,
            "chop": 4,
            "slice": 3,
            "dice": 4,
            "mince": 3,
            "mix": 2,
            "whisk": 2,
            "knead": 8,
            "rest": 10,
            "marinate": 30
        }
        
        step_lower = step_instruction.lower()
        for keyword, minutes in keywords.items():
            if keyword in step_lower:
                return minutes
        
        return 5  # Default
    
    def identify_parallel_tasks(self, timeline):
        """Identify tasks you can do simultaneously"""
        parallel_suggestions = []
        
        for i, task in enumerate(timeline):
            if task['duration_minutes'] > 5:
                # While this cooks, you could...
                suggestions = []
                
                if "boil" in task['instruction'].lower():
                    suggestions.append("Chop vegetables while water boils")
                if "simmer" in task['instruction'].lower():
                    suggestions.append("Prepare next ingredients while it simmers")
                if "bake" in task['instruction'].lower():
                    suggestions.append("Clean dishes while it bakes")
                
                if suggestions:
                    parallel_suggestions.append({
                        "during": task['instruction'],
                        "you_can": suggestions
                    })
        
        return parallel_suggestions
    
    def start_timer(self, duration_seconds, step_name, callback=None):
        """Start a countdown timer"""
        timer = threading.Timer(duration_seconds, callback if callback else lambda: None)
        timer.start()
        
        self.active_timers.append({
            "step": step_name,
            "duration": duration_seconds,
            "started_at": datetime.now(),
            "ends_at": datetime.now() + timedelta(seconds=duration_seconds),
            "timer": timer
        })
        
        return {
            "message": f"Timer set for {duration_seconds // 60} minutes",
            "ends_at": (datetime.now() + timedelta(seconds=duration_seconds)).isoformat()
        }
    
    def get_time_saving_tip(self, step):
        """Real time-saving cooking techniques"""
        tips = {
            "chop": "Use the claw grip - faster and safer!",
            "simmer": "Start with hot water to save 5 minutes",
            "boil": "Salt water boils faster (and seasons pasta)",
            "fry": "Pat dry ingredients first for better browning",
            "bake": "Bring ingredients to room temp for even cooking"
        }
        
        step_lower = step.lower()
        for keyword, tip in tips.items():
            if keyword in step_lower:
                return tip
        
        return "Mise en place saves time - prep everything first!"
    
    def log_completed_step(self, step_name, actual_minutes):
        """Track actual cooking time vs estimated"""
        self.time_log.append({
            "step": step_name,
            "estimated_minutes": self.estimate_step_time(step_name),
            "actual_minutes": actual_minutes,
            "difference": actual_minutes - self.estimate_step_time(step_name),
            "timestamp": datetime.now().isoformat()
        })
        
        # Provide feedback
        avg_difference = sum(t['difference'] for t in self.time_log) / len(self.time_log)
        
        if avg_difference > 5:
            return "You're taking longer than average. Try prepping ingredients first!"
        elif avg_difference < -3:
            return "You're fast! Consider adding more steps next time."
        else:
            return "Good timing! You're on track."
    
    def get_shopping_time_estimate(self, shopping_list):
        """Estimate how long grocery shopping will take"""
        item_count = len(shopping_list)
        base_time = 15  # entry + checkout
        
        # 30 seconds per item
        shopping_time = base_time + (item_count * 0.5)
        
        # Add travel time
        travel_time = 10  # average
        
        return {
            "shopping_minutes": round(shopping_time),
            "total_minutes": round(shopping_time + travel_time),
            "tips": [
                "Shop with a list to save time",
                "Go during off-peak hours (9am or 7pm)",
                "Use the store's app for aisle locations"
            ]
        }