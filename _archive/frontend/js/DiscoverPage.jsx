// Inside the .map() loop for trendingDishes
<div key={idx} className="flex flex-col md:flex-row gap-4 border-b-2 border-[#d4cfc4] pb-6 mb-6 last:border-0 last:pb-0">
  <div className="flex-1">
    <TrendingCostCard dish={dish} homeCost={dish.homeCost} savings={dish.savings} />
  </div>
  
  <div className="flex-1 md:max-w-sm">
    <StepQuestCard 
      recipe={{ name: dish.name, calories: Math.ceil(dish.homeCost * 100) }} // Mock calorie calc
      userDailySteps={6500} // This would come from HealthKit/GoogleFit
    />
  </div>
</div>