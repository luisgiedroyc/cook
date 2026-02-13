
import React, { useState, useEffect, useMemo } from 'react';
import { Restrictions, Recipe, Screen, Achievement, TimePreference, FoodFact, RecipeSet, MealType, UserStats, WeeklyPlan, DayPlan } from './types';
import { RECIPES_DB } from './recipesStore';

const ALLERGENS = [
  { id: 'noGluten', label: '🌾 Без глютена' },
  { id: 'noMilk', label: '🥛 Без молока' },
  { id: 'noEggs', label: '🥚 Без яиц' },
];

const DISLIKED_OPTIONS = [
  'лук', 'чеснок', 'грибы', 'свинина', 'острое', 'майонез'
];

const STATIC_FOOD_FACTS = [
  "Морковь изначально была фиолетовой!",
  "Сыр пармезан может храниться годами!",
  "Мед никогда не портится — его находили съедобным в гробницах фараонов.",
  "Яблоки плавают, потому что на 25% состоят из воздуха.",
  "Шоколад когда-то использовался в качестве валюты.",
  "Бананы — это ягоды, а клубника — нет.",
  "Огурцы на 95% состоят из воды.",
  "В одной средней пицце содержится около 2000 калорий.",
  "Кетчуп в 1830-х годах продавали как лекарство.",
  "Белый шоколад технически не является шоколадом, так как не содержит какао-порошка."
];

const LEVELS = [
  { name: 'Поварёнок', minXp: 0, icon: '🐣' },
  { name: 'Помощник повара', minXp: 100, icon: '🔪' },
  { name: 'Домашний кулинар', minXp: 300, icon: '🍳' },
  { name: 'Су-шеф', minXp: 600, icon: '👨‍🍳' },
  { name: 'Шеф-повар', minXp: 1000, icon: '🏅' },
  { name: 'Мастер кухни', minXp: 1500, icon: '🌟' },
  { name: 'Гранд-шеф', minXp: 2100, icon: '👑' },
];

const STATIC_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'no_delivery',
    title: 'Орден Чистой Сковороды',
    description: '10 дней без доставок',
    longDescription: 'Твой домашний очаг горит ярче всех неоновых вывесок курьеров. Ты овладел магией превращения простых продуктов в истинное наслаждение.',
    icon: '🛡️',
    unlocked: true
  },
  {
    id: 'early_bird',
    title: 'Ранний Ресторатор',
    description: '7 завтраков подряд',
    longDescription: 'Пока мир только открывает глаза, ты уже создаешь шедевры. Этот знак отличия для тех, кто понял ценность утра.',
    icon: '☀️',
    unlocked: true
  }
];

const STATIC_RECIPES_SETS: RecipeSet[] = [
  {
    id: 'base_100', 
    label: 'Золотая Сотня', 
    icon: '🏆', 
    color: 'bg-[#A3B565] text-white', 
    description: '100 самых простых и проверенных рецептов из любого супермаркета.',
    recipes: RECIPES_DB
  },
  {
    id: 'soon_asia', 
    label: 'Кухни Мира', 
    icon: '🌏', 
    color: 'bg-gray-200 text-gray-500', 
    description: 'Азия, Европа и Восток из простых ингредиентов.',
    isSoon: true,
    recipes: []
  },
  {
    id: 'soon_sweets', 
    label: 'Полезные десерты', 
    icon: '🧁', 
    color: 'bg-gray-200 text-gray-500', 
    description: 'Сладости, от которых не растет живот.',
    isSoon: true,
    recipes: []
  },
];

const QUIZ_QUESTIONS = [
  {
    id: 'vibe',
    q: "Какой вайб у твоего дня?",
    a: [
      { text: "Спокойный и размеренный", val: "спокойствие" },
      { text: "Активный и шумный", val: "энергия" },
      { text: "Ленивый и уютный", val: "уют" },
      { text: "Маленький праздник", val: "праздник" }
    ]
  },
  {
    id: 'hunger',
    q: "Насколько ты сейчас «в ресурсе»?",
    a: [
      { text: "Легкий перекус", val: "легкость" },
      { text: "Хочу полноценный обед", val: "сытно" },
      { text: "Готов горы свернуть", val: "сытно" }
    ]
  },
  {
    id: 'taste',
    q: "Чего просят вкусовые сосочки?",
    a: [
      { text: "Сладкого блаженства", val: "сладкое" },
      { text: "Соленой классики", val: "соленое" },
      { text: "Чего-то необычного", val: "пикантное" }
    ]
  },
  {
    id: 'temp',
    q: "Горяченькое или освежающее?",
    a: [
      { text: "Горячее, чтоб пар шел", val: "горячее" },
      { text: "Холодное/Освежающее", val: "холодное" }
    ]
  }
];

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [sourceScreen, setSourceScreen] = useState<Screen>('main');
  const [profileSub, setProfileSub] = useState<'main' | 'filters' | 'sets' | 'favorites'>('main');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [restrictions, setRestrictions] = useState<Restrictions>({
    noGluten: false, noMilk: false, noEggs: false, dislikedIngredients: []
  });
  const [timePref, setTimePref] = useState<TimePreference>('30-40');
  const [mealType, setMealType] = useState<MealType>('Обед');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  // Fix: Added missing viewingRecipe state to resolve "Cannot find name 'viewingRecipe'" errors
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    cookedCount: 0, streak: 5, totalXp: 0, completedChallenges: [], completedSets: []
  });
  const [dailyFact, setDailyFact] = useState<FoodFact | null>(null);
  const [collectedFacts, setCollectedFacts] = useState<FoodFact[]>([]);
  const [factTab, setFactTab] = useState<'daily' | 'collection'>('daily');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);

  useEffect(() => {
    const saved = (key: string) => localStorage.getItem(key);
    if (saved('restrictions')) setRestrictions(JSON.parse(saved('restrictions')!));
    if (saved('fav-recipes')) setFavorites(JSON.parse(saved('fav-recipes')!));
    if (saved('weekly-plan')) setWeeklyPlan(JSON.parse(saved('weekly-plan')!));
    if (saved('user-stats')) setStats(JSON.parse(saved('user-stats')!));
    if (saved('collected-facts')) setCollectedFacts(JSON.parse(saved('collected-facts')!));
    
    // Локальная замена ИИ-факта
    const today = new Date().toLocaleDateString();
    const factText = STATIC_FOOD_FACTS[Math.floor(Math.random() * STATIC_FOOD_FACTS.length)];
    const newFact: FoodFact = {
        id: Date.now().toString(),
        text: factText,
        date: today
    };

    setDailyFact(newFact);
    setCollectedFacts(prev => {
      if (prev.some(p => p.date === today)) return prev;
      const updated = [newFact, ...prev].slice(0, 50);
      localStorage.setItem('collected-facts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('restrictions', JSON.stringify(restrictions));
    localStorage.setItem('fav-recipes', JSON.stringify(favorites));
    localStorage.setItem('weekly-plan', JSON.stringify(weeklyPlan));
    localStorage.setItem('user-stats', JSON.stringify(stats));
  }, [restrictions, favorites, weeklyPlan, stats]);

  const currentLevelInfo = useMemo(() => {
    const sortedLevels = [...LEVELS].sort((a, b) => b.minXp - a.minXp);
    const current = sortedLevels.find(l => stats.totalXp >= l.minXp) || LEVELS[0];
    const nextIdx = LEVELS.findIndex(l => l.name === current.name) + 1;
    const next = LEVELS[nextIdx] || null;
    const progress = next ? ((stats.totalXp - current.minXp) / (next.minXp - current.minXp)) * 100 : 100;
    return { current, next, progress };
  }, [stats.totalXp]);

  const getFilteredRecipes = (mType: MealType, tPref: TimePreference, moodTags?: string[]) => {
    let pool = RECIPES_DB.filter(r => r.mealType === mType);

    if (restrictions.noGluten) pool = pool.filter(r => r.noGluten);
    if (restrictions.noMilk) pool = pool.filter(r => r.noMilk);
    if (restrictions.noEggs) pool = pool.filter(r => r.noEggs);

    const maxMins = tPref === '15-20' ? 20 : (tPref === '30-40' ? 40 : 60);
    pool = pool.filter(r => r.maxTime <= maxMins);

    if (restrictions.dislikedIngredients.length > 0) {
      pool = pool.filter(r => {
        const text = (r.name + r.ingredients.join(' ')).toLowerCase();
        return !restrictions.dislikedIngredients.some(dis => text.includes(dis.toLowerCase()));
      });
    }

    if (moodTags && moodTags.length > 0) {
      pool = pool.sort((a, b) => {
        const scoreA = a.tags.filter(t => moodTags.includes(t)).length;
        const scoreB = b.tags.filter(t => moodTags.includes(t)).length;
        return scoreB - scoreA;
      });
      pool = pool.slice(0, 10);
    }

    return pool.length > 0 ? pool : RECIPES_DB.filter(r => r.mealType === mType);
  };

  const handleGetRecipe = (isQuiz: boolean = false) => {
    setLoading(true);
    setTimeout(() => {
      const filtered = isQuiz 
        ? getFilteredRecipes(mealType, timePref, quizAnswers)
        : getFilteredRecipes(mealType, timePref);
      
      const randomRecipe = filtered[Math.floor(Math.random() * filtered.length)];
      setRecipe(randomRecipe);
      
      if (isQuiz) {
        setSourceScreen('test');
        // Fix: correctly uses setViewingRecipe
        setViewingRecipe(randomRecipe);
        setCurrentScreen('view-recipe');
      }
      setLoading(false);
    }, 800);
  };

  const addToWeeklyPlan = (r: Recipe, date: Date, mType: MealType) => {
    const dateKey = formatDateKey(date);
    const newPlan = { ...weeklyPlan };
    if (!newPlan[dateKey]) newPlan[dateKey] = {};
    newPlan[dateKey][mType] = r;
    setWeeklyPlan(newPlan);
    setStats(prev => ({ ...prev, totalXp: prev.totalXp + 10 }));
  };

  const handleCookDone = (r: Recipe) => {
    setStats(prev => ({ ...prev, cookedCount: prev.cookedCount + 1, totalXp: prev.totalXp + 25 }));
    alert("Круто! +25 опыта 👨‍🍳");
  };

  const toggleFav = (r: Recipe) => {
    const isFav = favorites.some(f => f.id === r.id);
    setFavorites(isFav ? favorites.filter(f => f.id !== r.id) : [...favorites, r]);
  };

  const renderRecipeDetails = (r: Recipe, onClose: () => void) => (
    <div className="bg-[#FDF8E2] min-h-screen p-6 animate-slide-up pb-32">
      <button onClick={onClose} className="mb-6 font-black text-[#F1642E] flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Назад
      </button>
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#A3B565] text-white">{r.difficulty}</span>
        <button onClick={() => toggleFav(r)} className="text-2xl transition-transform active:scale-125">
          {favorites.some(f => f.id === r.id) ? "❤️" : "🤍"}
        </button>
      </div>
      <h1 className="text-3xl font-black text-[#2F2F2F] mb-8 italic leading-tight">{r.name}</h1>
      
      <div className="flex gap-2 mb-8">
        <button onClick={() => { addToWeeklyPlan(r, selectedDate, r.mealType); alert("Добавлено в план!"); }} className="flex-1 py-4 bg-[#F1642E] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all">Буду готовить</button>
        <button onClick={() => { handleCookDone(r); onClose(); }} className="px-6 py-4 bg-[#2F2F2F] text-white rounded-2xl font-black text-sm active:scale-95 transition-all">Готово!</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 bg-[#FCDD9D]/50 p-5 rounded-3xl border border-[#FCDD9D]">
        <div><div className="text-[10px] text-[#6B6B6B] font-black uppercase">Общее время</div><div className="font-bold text-[#2F2F2F]">⏳ {r.totalTime}</div></div>
        <div><div className="text-[10px] text-[#6B6B6B] font-black uppercase">Подготовка</div><div className="font-bold text-[#2F2F2F]">🔪 {r.activePrepTime}</div></div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#6B6B6B] mb-4 border-b border-[#FCDD9D] pb-1">Ингредиенты</h3>
        <ul className="space-y-3">
          {r.ingredients.map((ing, i) => (
            <li key={i} className="flex gap-3 text-sm text-[#2F2F2F] items-start">
              <span className="w-1.5 h-1.5 bg-[#A3B565] rounded-full mt-1.5 shrink-0"></span>
              {ing}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#6B6B6B] mb-4 border-b border-[#FCDD9D] pb-1">Как готовить</h3>
        <div className="space-y-6">
          {r.instructions.map((s, i) => (
            <div key={i} className="flex gap-4">
              <span className="font-black text-[#A3B565] text-lg">{i+1}</span>
              <p className="text-sm leading-relaxed text-[#2F2F2F]">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFact = () => (
    <div className="p-6 bg-[#FDF8E2] min-h-screen pb-32 flex flex-col items-center">
      <div className="w-full flex justify-center mb-8">
        <div className="bg-[#FCDD9D]/50 p-1 rounded-2xl flex w-full max-w-xs shadow-inner border border-[#FCDD9D]/30">
          <button onClick={() => setFactTab('daily')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${factTab === 'daily' ? 'bg-[#F1642E] text-white shadow-sm' : 'text-[#6B6B6B]'}`}>Факт дня</button>
          <button onClick={() => setFactTab('collection')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${factTab === 'collection' ? 'bg-[#F1642E] text-white shadow-sm' : 'text-[#6B6B6B]'}`}>Коллекция</button>
        </div>
      </div>

      {factTab === 'daily' ? (
        <div key="daily" className="w-full max-w-xs animate-card-appear text-center">
           <div className="relative aspect-[3/4] bg-gradient-to-br from-[#FCDD9D] to-[#F1642E] rounded-[3.5rem] p-8 text-white shadow-2xl flex flex-col items-center justify-center border-[8px] border-white">
              <span className="text-6xl mb-6">💡</span>
              <p className="text-xl font-bold italic leading-relaxed">«{dailyFact?.text}»</p>
           </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {collectedFacts.map(f => (
            <div key={f.id} className="bg-[#FCDD9D] p-6 rounded-[2rem] border border-white/30 flex items-start gap-4">
              <div className="text-2xl">🥚</div>
              <div>
                <p className="text-xs text-[#F1642E] font-black uppercase mb-1">{f.date}</p>
                <p className="text-sm font-bold text-[#2F2F2F]">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTest = () => {
    if (quizStep >= QUIZ_QUESTIONS.length) {
      return (
        <div className="p-6 bg-[#FDF8E2] min-h-screen flex flex-col items-center justify-center text-center">
          <div className="text-7xl mb-6 animate-bounce">🥘</div>
          <h2 className="text-3xl font-black mb-4 text-[#2F2F2F]">Анализ завершен!</h2>
          <p className="text-[#6B6B6B] mb-10 leading-relaxed px-6">Мы изучили твои ответы и нашли идеальное совпадение в «Золотой Сотне».</p>
          <button onClick={() => handleGetRecipe(true)} disabled={loading} className="w-full py-6 bg-[#F1642E] text-white rounded-[2.2rem] font-black shadow-xl active:scale-95 transition-all">
            {loading ? "Подбираем..." : "Посмотреть результат"}
          </button>
        </div>
      );
    }
    const q = QUIZ_QUESTIONS[quizStep];
    return (
      <div className="p-6 bg-[#FDF8E2] min-h-screen pb-32">
        <div className="mt-12 mb-10">
          <div className="flex gap-2 mb-6">
            {QUIZ_QUESTIONS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i <= quizStep ? 'bg-[#A3B565]' : 'bg-[#FCDD9D]'}`}></div>
            ))}
          </div>
          <h1 className="text-3xl font-black leading-tight text-[#2F2F2F]">{q.q}</h1>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {q.a.map((ans, idx) => (
            <button key={idx} onClick={() => { setQuizAnswers([...quizAnswers, ans.val]); setQuizStep(quizStep + 1); }} className="py-6 px-8 bg-[#FCDD9D] rounded-[2.2rem] text-left font-bold text-[#2F2F2F] active:scale-95 border border-transparent hover:border-[#F1642E] transition-all">
              {ans.text}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMain = () => (
    <div className="p-6 md:p-8 flex flex-col items-center min-h-screen">
      {!recipe ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full transform -translate-y-12">
          <button onClick={() => handleGetRecipe()} disabled={loading} className={`w-64 h-64 rounded-full text-xl font-black transition-all transform active:scale-90 shadow-2xl flex flex-col items-center justify-center text-center p-8 border-[12px] group ${loading ? 'bg-[#FCDD9D] animate-pulse border-white' : 'bg-[#F1642E] border-[#FCDD9D] text-white shadow-[#FCDD9D]/50 hover:rotate-2'}`}>
            {loading ? <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div> : <><div className="text-5xl mb-4">🍳</div>Что мне сегодня поесть?</>}
          </button>
          {!loading && (
            <div className="mt-12 space-y-4 text-center">
              <div className="flex justify-center gap-2">
                {(['Завтрак', 'Обед', 'Ужин'] as MealType[]).map(t => (
                  <button key={t} onClick={() => setMealType(t)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${mealType === t ? 'bg-[#F1642E] text-white' : 'bg-[#FCDD9D] text-[#6B6B6B]'}`}>{t}</button>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                {(['15-20', '30-40', '60'] as TimePreference[]).map(t => (
                  <button key={t} onClick={() => setTimePref(t)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${timePref === t ? 'bg-[#F1642E] text-white' : 'bg-[#FCDD9D] text-[#6B6B6B]'}`}>{t === '60' ? '1ч' : `${t}м`}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full mt-10 animate-card-appear bg-[#FCDD9D] rounded-[3.5rem] p-8 shadow-2xl border border-white/30">
           <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#A3B565] text-white">{recipe.difficulty}</span>
              <button onClick={() => { setSourceScreen(currentScreen); setViewingRecipe(recipe); setCurrentScreen('view-recipe'); }} className="text-xs font-black text-[#F1642E]">Открыть →</button>
           </div>
           <h2 className="text-2xl font-black text-[#2F2F2F] italic mb-6">{recipe.name}</h2>
           <div className="bg-white/40 p-5 rounded-2xl mb-8 border border-white/20">
              <p className="text-xs font-bold italic text-[#2F2F2F]">😋 {recipe.tasteDescription}</p>
           </div>
           <div className="flex gap-3">
              <button onClick={() => { addToWeeklyPlan(recipe, selectedDate, recipe.mealType); alert("Добавлено в plan!"); }} className="flex-1 py-4 bg-white/60 text-[#2F2F2F] rounded-2xl font-black text-xs">В план</button>
              <button onClick={() => setRecipe(null)} className="flex-[2] py-4 bg-[#F1642E] text-white rounded-2xl font-black text-sm shadow-lg">🔄 Другой</button>
           </div>
        </div>
      )}
    </div>
  );

  const renderToCook = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const currentDayPlan = weeklyPlan[formatDateKey(selectedDate)] || {};
    const mealTypes: MealType[] = ['Завтрак', 'Обед', 'Ужин'];

    return (
      <div className="p-6 bg-[#FDF8E2] min-h-screen pb-32 animate-slide-up">
        {/* Weekly Tracker Header */}
        <section className="mb-10">
          <h2 className="text-2xl font-black mb-6 italic text-[#2F2F2F]">Моя неделя</h2>
          <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar py-2">
            {days.map((d, i) => {
              const isActive = formatDateKey(d) === formatDateKey(selectedDate);
              const isToday = formatDateKey(d) === formatDateKey(new Date());
              return (
                <button 
                  key={i} 
                  onClick={() => setSelectedDate(d)}
                  className={`shrink-0 w-12 h-16 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm ${isActive ? 'bg-[#F1642E] text-white scale-110 shadow-orange-200' : 'bg-[#FCDD9D] text-[#6B6B6B]'}`}
                >
                  <span className="text-[9px] font-black uppercase mb-1">{d.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                  <span className="text-lg font-black">{d.getDate()}</span>
                  {isToday && <div className={`w-1 h-1 rounded-full mt-1 ${isActive ? 'bg-white' : 'bg-[#F1642E]'}`}></div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Daily Plan Card */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#FCDD9D]/50 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black italic text-[#2F2F2F]">План на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</h3>
          </div>
          
          <div className="space-y-6">
            {mealTypes.map(m => {
              const r = currentDayPlan[m];
              return (
                <div key={m} className="group">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#6B6B6B]">{m}</span>
                  </div>
                  {r ? (
                    <button 
                      onClick={() => { setViewingRecipe(r); setSourceScreen('tocook'); setCurrentScreen('view-recipe'); }}
                      className="w-full bg-[#FCDD9D] p-5 rounded-[2rem] flex items-center justify-between group-active:scale-95 transition-all border border-transparent hover:border-[#F1642E]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{m === 'Завтрак' ? '🥣' : m === 'Обед' ? '🍛' : '🍲'}</span>
                        <div className="text-left">
                          <h4 className="font-bold text-sm text-[#2F2F2F] leading-tight line-clamp-1">{r.name}</h4>
                          <span className="text-[10px] font-black text-[#F1642E] uppercase">{r.totalTime}</span>
                        </div>
                      </div>
                      <span className="text-[#F1642E] text-xl">→</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setMealType(m); setCurrentScreen('main'); }}
                      className="w-full border-2 border-dashed border-[#FCDD9D] p-5 rounded-[2rem] flex items-center gap-4 text-[#6B6B6B] group-active:bg-[#FCDD9D]/20 transition-all"
                    >
                      <div className="w-10 h-10 bg-[#FCDD9D] rounded-xl flex items-center justify-center text-xl text-[#F1642E] font-black">+</div>
                      <span className="text-xs font-bold">Добавить {m.toLowerCase()}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Progress Block */}
        <section className="bg-[#A3B565] text-white rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden">
           <div className="relative z-10">
              <h4 className="text-sm font-black mb-2 italic">Готовлю дома уже {stats.streak} дней подряд!</h4>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-4 border border-white/30">
                 <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(stats.streak / 30) * 100}%` }}></div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest mt-3 opacity-80">До следующей награды: {30 - stats.streak} дней</p>
           </div>
           <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 rotate-12">🍳</div>
        </section>
      </div>
    );
  };

  const renderSetsScreen = () => {
    const activeSet = STATIC_RECIPES_SETS.find(s => s.id === selectedSetId);

    if (selectedSetId && activeSet) {
      return (
        <div className="animate-slide-up">
          <button onClick={() => setSelectedSetId(null)} className="mb-8 font-black text-[#F1642E] flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Назад к наборам
          </button>
          
          <div className="mb-10 flex items-center gap-4">
             <div className={`w-16 h-16 ${activeSet.color} rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg`}>{activeSet.icon}</div>
             <div>
                <h2 className="text-2xl font-black text-[#2F2F2F] italic leading-tight">{activeSet.label}</h2>
                <p className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider">{activeSet.recipes.length} блюд</p>
             </div>
          </div>

          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-10 px-2 italic">{activeSet.description}</p>

          <div className="space-y-3">
             {activeSet.recipes.map(r => (
               <button 
                 key={r.id} 
                 onClick={() => { setSourceScreen(currentScreen); setViewingRecipe(r); setCurrentScreen('view-recipe'); }}
                 className="w-full bg-[#FCDD9D] p-5 rounded-[2rem] flex justify-between items-center text-left border border-white/30 group active:scale-[0.98] transition-all"
               >
                 <div className="flex items-center gap-4">
                    <span className="text-xl">{r.mealType === 'Завтрак' ? '🥣' : r.mealType === 'Обед' ? '🍛' : '🍲'}</span>
                    <div>
                       <h4 className="font-bold text-[#2F2F2F] text-sm line-clamp-1">{r.name}</h4>
                       <span className="text-[9px] font-black text-[#F1642E] uppercase">{r.totalTime} • {r.difficulty}</span>
                    </div>
                 </div>
                 <span className="text-[#F1642E] font-black group-hover:translate-x-1 transition-transform">→</span>
               </button>
             ))}
          </div>
        </div>
      );
    }

    return (
      <div className="animate-slide-up">
        <button onClick={() => setProfileSub('main')} className="mb-8 font-black text-[#F1642E]">← Назад</button>
        <h2 className="text-3xl font-black mb-10 italic">Наборы блюд</h2>
        
        <div className="space-y-4">
          {STATIC_RECIPES_SETS.map(s => (
            <button 
              key={s.id} 
              onClick={() => !s.isSoon && setSelectedSetId(s.id)}
              className={`w-full p-6 rounded-[2.2rem] flex items-center justify-between text-left transition-all relative overflow-hidden ${s.isSoon ? 'bg-[#FCDD9D]/50 border-transparent' : 'bg-[#FCDD9D] border border-white/30 shadow-sm active:scale-95'}`}
            >
              <div className={`flex items-center gap-4 ${s.isSoon ? 'opacity-40' : ''}`}>
                 <div className={`w-12 h-12 ${s.color} rounded-[1.2rem] flex items-center justify-center text-2xl`}>{s.icon}</div>
                 <div>
                    <h3 className="font-black text-[#2F2F2F] text-lg">{s.label}</h3>
                    {!s.isSoon && <span className="text-[9px] font-black text-[#6B6B6B] uppercase">{s.recipes.length} рецептов</span>}
                 </div>
              </div>
              
              {s.isSoon ? (
                <span className="bg-[#F1642E] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Скоро</span>
              ) : (
                <span className="text-[#F1642E] text-xl font-black">→</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-12 p-8 bg-[#A3B565]/10 rounded-[2.5rem] border border-[#A3B565]/20">
           <p className="text-xs text-[#A3B565] font-black text-center italic">Мы постоянно добавляем новые наборы, чтобы твой рацион был максимально разнообразным! ✨</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF8E2]">
      {selectedAchievement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-[#FDF8E2] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-pop-in border-[10px] border-white" onClick={e => e.stopPropagation()}>
             <div className="h-40 flex items-center justify-center text-7xl bg-gradient-to-br from-[#A3B565] to-[#F1642E]/20">
                <div className="animate-bounce-slow">{selectedAchievement.icon}</div>
             </div>
             <div className="p-8 text-center">
                <h2 className="text-2xl font-black mb-4 italic text-[#2F2F2F]">{selectedAchievement.title}</h2>
                <p className="text-[#6B6B6B] text-sm italic mb-10">{selectedAchievement.longDescription}</p>
                <button onClick={() => setSelectedAchievement(null)} className="w-full py-4 bg-[#F1642E] text-white rounded-2xl font-black text-sm">Закрыть</button>
             </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto">
        {currentScreen === 'main' && renderMain()}
        {currentScreen === 'fact' && renderFact()}
        {currentScreen === 'test' && renderTest()}
        {currentScreen === 'tocook' && renderToCook()}
        {currentScreen === 'profile' && (
          <div className="p-6 bg-[#FDF8E2] min-h-screen pb-32">
            {profileSub === 'main' ? (
              <>
                <div className="text-center mt-10 mb-10">
                   <div className="w-24 h-24 bg-[#FCDD9D] rounded-[2.5rem] mx-auto mb-4 flex items-center justify-center text-4xl border border-white">👨‍🍳</div>
                   <h1 className="text-2xl font-black italic">Шеф-Повар</h1>
                   <p className="text-[#A3B565] text-[10px] font-black uppercase tracking-widest">{currentLevelInfo.current.name}</p>
                </div>
                <div className="space-y-3">
                  <button onClick={() => setCurrentScreen('chef-progress')} className="w-full py-6 bg-[#F1642E] text-white rounded-[2.2rem] font-black text-left px-8 flex justify-between shadow-xl"><span>🏅 Достижения</span><span>→</span></button>
                  <button onClick={() => setProfileSub('filters')} className="w-full py-6 bg-[#FCDD9D] rounded-[2.2rem] font-black text-left px-8 flex justify-between"><span>⚙️ Предпочтения</span><span>→</span></button>
                  <button onClick={() => setProfileSub('favorites')} className="w-full py-6 bg-[#FCDD9D] rounded-[2.2rem] font-black text-left px-8 flex justify-between"><span>❤️ Избранное</span><span>→</span></button>
                  <button onClick={() => setProfileSub('sets')} className="w-full py-6 bg-[#FCDD9D] rounded-[2.2rem] font-black text-left px-8 flex justify-between"><span>🍱 Наборы</span><span>→</span></button>
                </div>
              </>
            ) : profileSub === 'filters' ? (
              <div className="animate-slide-up">
                <button onClick={() => setProfileSub('main')} className="mb-8 font-black text-[#F1642E]">← Назад</button>
                <h2 className="text-2xl font-black mb-8">Фильтры</h2>
                <div className="space-y-3 mb-10">
                  {ALLERGENS.map(item => (
                    <button key={item.id} onClick={() => setRestrictions(p => ({...p, [item.id]: !((p as any)[item.id])}))} className={`w-full py-5 px-6 rounded-3xl border-2 font-bold flex justify-between transition-all ${ (restrictions as any)[item.id] ? 'bg-[#A3B565] border-[#A3B565] text-white' : 'bg-[#FCDD9D] border-[#FCDD9D] text-[#6B6B6B]'}`}>
                      {item.label} {(restrictions as any)[item.id] && '✓'}
                    </button>
                  ))}
                </div>
                <h3 className="text-[10px] font-black uppercase text-[#6B6B6B] mb-4">Не хочу видеть в составе:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {DISLIKED_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setRestrictions(p => ({...p, dislikedIngredients: p.dislikedIngredients.includes(opt) ? p.dislikedIngredients.filter(i => i !== opt) : [...p.dislikedIngredients, opt] }))} className={`py-3 px-4 rounded-2xl border text-[10px] font-black uppercase ${restrictions.dislikedIngredients.includes(opt) ? 'bg-[#F1642E] text-white border-[#F1642E]' : 'bg-[#FCDD9D] text-[#6B6B6B] border-transparent'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : profileSub === 'favorites' ? (
              <div className="animate-slide-up">
                <button onClick={() => setProfileSub('main')} className="mb-8 font-black text-[#F1642E]">← Назад</button>
                <h2 className="text-2xl font-black mb-8 italic">Избранное</h2>
                <div className="space-y-3">
                  {favorites.length === 0 ? <div className="text-center py-20 opacity-20 font-black">ПУСТО</div> : favorites.map(f => (
                    <button key={f.id} onClick={() => { setSourceScreen(currentScreen); setViewingRecipe(f); setCurrentScreen('view-recipe'); }} className="w-full p-6 bg-[#FCDD9D] rounded-[2.2rem] flex justify-between items-center border border-white/30">
                      <div><h3 className="font-black text-[#2F2F2F] mb-1">{f.name}</h3><span className="text-[10px] font-black uppercase text-[#F1642E]">{f.totalTime}</span></div>
                      <span className="text-2xl">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              renderSetsScreen()
            )}
          </div>
        )}
        {currentScreen === 'chef-progress' && (
          <div className="p-6 bg-[#FDF8E2] min-h-screen pb-32 animate-slide-up">
            <button onClick={() => setCurrentScreen('profile')} className="mb-8 font-black text-[#F1642E]">← Назад</button>
            <div className="text-center mb-10">
               <div className="text-6xl mb-4">{currentLevelInfo.current.icon}</div>
               <h1 className="text-3xl font-black mb-1 italic text-[#2F2F2F]">{currentLevelInfo.current.name}</h1>
               <div className="text-[10px] font-black uppercase text-[#A3B565] tracking-widest">Твой уровень</div>
            </div>
            <div className="bg-[#FCDD9D] p-8 rounded-[3rem] mb-10 border border-white/30">
               <div className="flex justify-between items-end mb-4">
                  <div className="text-[10px] font-black uppercase text-[#6B6B6B]">Опыт</div>
                  <div className="text-[10px] font-black text-[#F1642E]">{stats.totalXp} / {currentLevelInfo.next?.minXp || 'MAX'}</div>
               </div>
               <div className="h-4 bg-white/30 rounded-full overflow-hidden border border-white">
                  <div className="h-full bg-[#A3B565] transition-all duration-1000" style={{ width: `${currentLevelInfo.progress}%` }}></div>
               </div>
            </div>
            <h3 className="text-[10px] font-black uppercase text-[#6B6B6B] mb-6 border-b border-[#FCDD9D] pb-2">Награды</h3>
            <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
               {STATIC_ACHIEVEMENTS.map(ach => (
                 <button key={ach.id} onClick={() => setSelectedAchievement(ach)} className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-3xl shadow-lg border-4 border-[#FCDD9D]">{ach.icon}</div>
                    <div className="text-[9px] font-black uppercase text-center max-w-[80px] leading-tight">{ach.title}</div>
                 </button>
               ))}
            </div>
          </div>
        )}
        {currentScreen === 'view-recipe' && viewingRecipe && (
          renderRecipeDetails(viewingRecipe, () => {
            setViewingRecipe(null);
            setCurrentScreen(sourceScreen);
          })
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#FCDD9D] h-24 border-t border-[#FDF8E2] flex items-center justify-around z-[100] shadow-2xl px-2">
        <button onClick={() => { setFactTab('daily'); setCurrentScreen('fact'); }} className="flex flex-col items-center justify-center gap-1.5 flex-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={currentScreen === 'fact' ? "text-[#F1642E]" : "text-[#6B6B6B]"}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/><path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${currentScreen === 'fact' ? 'text-[#F1642E]' : 'text-[#6B6B6B]'}`}>Факт</span>
        </button>
        <button onClick={() => { setQuizStep(0); setQuizAnswers([]); setCurrentScreen('test'); }} className="flex flex-col items-center justify-center gap-1.5 flex-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={currentScreen === 'test' ? "text-[#F1642E]" : "text-[#6B6B6B]"}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.2c.4 0 .8.1 1.2.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${currentScreen === 'test' ? 'text-[#F1642E]' : 'text-[#6B6B6B]'}`}>Тест</span>
        </button>
        <div className="flex-1 flex justify-center -mt-8">
          <button onClick={() => { setRecipe(null); setCurrentScreen('main'); }} className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all transform active:scale-90 ${currentScreen === 'main' ? 'bg-[#F1642E] text-white rotate-6' : 'bg-[#2F2F2F] text-white'}`}>
             <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
          </button>
        </div>
        <button onClick={() => setCurrentScreen('tocook')} className="flex flex-col items-center justify-center gap-1.5 flex-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={currentScreen === 'tocook' ? "text-[#F1642E]" : "text-[#6B6B6B]"}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2.5"/>
          </svg>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${currentScreen === 'tocook' ? 'text-[#F1642E]' : 'text-[#6B6B6B]'}`}>План</span>
        </button>
        <button onClick={() => { setProfileSub('main'); setCurrentScreen('profile'); }} className="flex flex-col items-center justify-center gap-1.5 flex-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={currentScreen === 'profile' || currentScreen === 'chef-progress' ? "text-[#F1642E]" : "text-[#6B6B6B]"}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
          </svg>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${currentScreen === 'profile' || currentScreen === 'chef-progress' ? 'text-[#F1642E]' : 'text-[#6B6B6B]'}`}>Профиль</span>
        </button>
      </nav>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.8) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(5%); } }
        .animate-card-appear { animation: slide-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
