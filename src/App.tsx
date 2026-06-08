import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  Check, 
  Edit3, 
  X, 
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Todo, FilterType, SortType } from './types';

// Default categories
const DEFAULT_CATEGORIES = [
  { name: '工作', icon: '💼', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: '个人', icon: '🏡', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { name: '购物', icon: '🛒', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { name: '阅读', icon: '📚', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: '健康', icon: '🏃', color: 'bg-rose-100 text-rose-700 border-rose-200' }
];

const getFutureDateStr = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const INITIAL_TODOS: Todo[] = [
  {
    id: 'init-1',
    text: '点击输入框，开始创建你的第一个任务吧 ✨',
    completed: false,
    priority: 'medium',
    category: '个人',
    dueDate: getFutureDateStr(2),
    progress: 20,
    progressColor: '#8b5cf6', // default purple tint
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
  },
  {
    id: 'init-2',
    text: '点击任务左侧的圆圈，即可标记为已完成 🎯',
    completed: false,
    priority: 'high',
    category: '工作',
    dueDate: getFutureDateStr(0),
    progress: 50,
    progressColor: '#3b82f6', // blue
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    id: 'init-3',
    text: '这是一个已经完成的任务，你可以点击右侧的垃圾桶删除它 🗑️',
    completed: true,
    priority: 'low',
    category: '购物',
    dueDate: getFutureDateStr(-1),
    progress: 100,
    progressColor: '#10b981', // emerald
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hour ago
  }
];

export default function App() {
  // --- States ---
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem('blue-todo-items');
      return saved ? JSON.parse(saved) : INITIAL_TODOS;
    } catch {
      return INITIAL_TODOS;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('blue-todo-categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES.map(c => c.name);
    } catch {
      return DEFAULT_CATEGORIES.map(c => c.name);
    }
  });

  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [inputCategory, setInputCategory] = useState('个人');
  const [inputDueDate, setInputDueDate] = useState('');
  const [inputProgress, setInputProgress] = useState(0);
  const [inputProgressColor, setInputProgressColor] = useState('#8b5cf6'); // Default purple
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [currentSort, setCurrentSort] = useState<SortType>('date');
  
  // Custom category creation state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('💡');
  const [showMetaConfig, setShowMetaConfig] = useState(false);

  // Input ref to focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Advanced editing fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPriority, setEditingPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editingCategory, setEditingCategory] = useState('个人');
  const [editingDueDate, setEditingDueDate] = useState('');
  const [editingProgress, setEditingProgress] = useState(0);
  const [editingProgressColor, setEditingProgressColor] = useState('#8b5cf6');

  // Save to local storage automatically
  useEffect(() => {
    localStorage.setItem('blue-todo-items', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('blue-todo-categories', JSON.stringify(categories));
  }, [categories]);

  // --- Dynamic Greeting ---
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) return { text: '早上好 🌥️', sub: '开始新一天的专注规划吧。' };
    if (hours >= 11 && hours < 14) return { text: '中午好 ☀️', sub: '合理规划，保持饱满的工作状态。' };
    if (hours >= 14 && hours < 18) return { text: '下午好 ☕', sub: '一步一个脚印，将目标化繁为简。' };
    return { text: '晚上好 🌙', sub: '回顾一天的成果，让思绪慢慢安静下来。' };
  }, []);

  // --- Calculations ---
  const counts = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, percent };
  }, [todos]);

  // Priority metadata for colors and sorting values
  const priorityInfo = {
    high: { label: '高', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', val: 3 },
    medium: { label: '中', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', val: 2 },
    low: { label: '低', color: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400', val: 1 }
  };

  // Get color configuration for categories (including dynamically created ones)
  const getCategoryTheme = (catName: string) => {
    const found = DEFAULT_CATEGORIES.find(c => c.name === catName);
    if (found) return found;
    // Generate a systematic soft tint color for user-defined categories based on string hash
    const colors = [
      { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '💡' },
      { color: 'bg-pink-50 text-pink-700 border-pink-200', icon: '💡' },
      { color: 'bg-teal-50 text-teal-700 border-teal-100', icon: '💡' },
      { color: 'bg-cyan-50 text-cyan-700 border-cyan-100', icon: '💡' },
      { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '💡' }
    ];
    let hash = 0;
    for (let i = 0; i < catName.length; i++) {
      hash = catName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return {
      name: catName,
      icon: '✨',
      color: colors[index].color
    };
  };

  // Get status and styling for due dates
  const getDueDateStatus = (dueDate: string | undefined, completed: boolean) => {
    if (!dueDate) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDate = dueDate.replace(/-/g, '/'); // From 2026-06-09 to 2026/06/09

    if (completed) {
      return { label: formattedDate, style: 'bg-slate-100/70 text-slate-400 border-slate-200' };
    }
    if (dueDate < todayStr) {
      return { label: `${formattedDate} ⚠️`, style: 'bg-red-50 text-red-700 border-red-200 font-bold' };
    }
    if (dueDate === todayStr) {
      return { label: `今天 🕒`, style: 'bg-amber-50 text-amber-500 border-amber-200 font-bold' };
    }
    return { label: formattedDate, style: 'bg-sky-50 text-sky-700 border-sky-150' };
  };

  // --- Handlers ---
  const handleAddTodo = (e: FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const isNowCompleted = inputProgress === 100;

    const newTodo: Todo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text,
      completed: isNowCompleted,
      priority: inputPriority,
      category: inputCategory,
      dueDate: inputDueDate || undefined,
      progress: inputProgress,
      progressColor: inputProgressColor,
      createdAt: new Date().toISOString()
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputText('');
    setInputDueDate('');
    setInputProgress(0);
    setInputProgressColor('#8b5cf6');
    
    // Auto-scroll logic or focusing input again
    inputRef.current?.focus();
  };

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const nextCompleted = !todo.completed;
        return { 
          ...todo, 
          completed: nextCompleted,
          // Requirement #5 & #4: If completed toggle, sync progress to 100% or 0%
          progress: nextCompleted ? 100 : 0
        };
      }
      return todo;
    }));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
    setEditingPriority(todo.priority);
    setEditingCategory(todo.category);
    setEditingDueDate(todo.dueDate || '');
    setEditingProgress(todo.progress ?? (todo.completed ? 100 : 0));
    setEditingProgressColor(todo.progressColor || '#8b5cf6');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;
    const isNowCompleted = editingProgress === 100;
    
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          text: editingText.trim(),
          priority: editingPriority,
          category: editingCategory,
          dueDate: editingDueDate || undefined,
          progress: editingProgress,
          progressColor: editingProgressColor,
          completed: isNowCompleted
        };
      }
      return todo;
    }));
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleCreateCategory = (e: FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      // Already exists, just select it
      setInputCategory(name);
      setShowAddCategory(false);
      setNewCatName('');
      return;
    }

    setCategories(prev => [...prev, name]);
    setInputCategory(name);
    setNewCatName('');
    setShowAddCategory(false);
  };

  const handleClearCompleted = () => {
    if (confirm('确定要清除所有已完成的待办事项吗？')) {
      setTodos(prev => prev.filter(t => !t.completed));
    }
  };

  const handleResetToDefault = () => {
    if (confirm('确定要重置应用吗？这会恢复默认的待办事项。')) {
      setTodos(INITIAL_TODOS);
      setCategories(DEFAULT_CATEGORIES.map(c => c.name));
      setCurrentFilter('all');
      setCurrentSort('date');
    }
  };

  // --- Filtered and Sorted list ---
  const filteredAndSortedTodos = useMemo(() => {
    return todos
      // Filter by Search Query
      .filter(todo => {
        if (!searchQuery.trim()) return true;
        return todo.text.toLowerCase().includes(searchQuery.toLowerCase());
      })
      // Filter by Selected Tab
      .filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
      })
      // Sorted
      .sort((a, b) => {
        // Requirement #3: Completed tasks always drop to the bottom of the list under any sort view
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (currentSort === 'priority') {
          // Compare priorities first
          const rankA = priorityInfo[a.priority].val;
          const rankB = priorityInfo[b.priority].val;
          if (rankA !== rankB) return rankB - rankA; // high to low
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // secondary sort by newest
        }
        if (currentSort === 'alphabetical') {
          return a.text.localeCompare(b.text, 'zh');
        }
        // Default: Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [todos, searchQuery, currentFilter, currentSort]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-purple-50/70 pb-16 pt-6 transition-colors duration-300 md:pt-12">
      <div className="mx-auto w-full max-w-3xl px-4">
        
        {/* --- Header Panel --- */}
        <header className="mb-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm ring-4 ring-blue-500/5 transition-all md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Check className="h-5 w-5 stroke-[3]" />
                </span>
                <h1 id="app-title" className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
                  我的待办事项
                </h1>
              </div>
            </div>
            
            {/* Quick action: Restore default */}
            <button 
              id="btn-reset-defaults"
              onClick={handleResetToDefault}
              className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:self-center"
              title="恢复成默认测试数据"
            >
              <RotateCcw className="mr-1 inline-block h-3.5 w-3.5" />
              恢复默认
            </button>
          </div>

          {/* --- Progress Bar Section --- */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <div className="flex items-center gap-4">
                <div id="stat-total" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  <span>任务总数: <span className="font-bold text-slate-800">{counts.total}</span></span>
                </div>
                <div id="stat-pending" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span>未完成: <span className="font-bold text-slate-800">{counts.active}</span></span>
                </div>
                <div id="stat-completed" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>已完成: <span className="font-bold text-slate-800">{counts.completed}</span></span>
                </div>
              </div>
              
              <div id="stat-percent" className="font-semibold text-blue-600">
                完成率 {counts.percent}%
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                id="progress-indicator-bar"
                className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" 
                style={{ width: `${counts.percent}%` }}
              />
            </div>
          </div>
        </header>


        {/* --- Form Section: Create Task --- */}
        <section id="add-todo-section" className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            新建待办事项
          </h2>
          
          <form onSubmit={handleAddTodo}>
            {/* Input Row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input 
                id="todo-input-field"
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="你想做点什么？（如：今天晚上跑步 5 公里）"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              />
              
              <button
                id="btn-add-todo"
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-medium px-6 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>添加任务</span>
              </button>
            </div>

            {/* Expand / Collapse Control Bar */}
            <div className="mt-3.5 flex items-center justify-between">
              <button
                id="btn-toggle-meta"
                type="button"
                onClick={() => setShowMetaConfig(!showMetaConfig)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 focus:outline-none transition-colors duration-150 py-1"
              >
                <span>{showMetaConfig ? '收起附加属性选项' : '展开附加属性选项 (分类、优先级、截止时间、初始进度等) 🔽'}</span>
                {showMetaConfig ? <ChevronUp className="h-4 w-4 text-blue-500 animate-bounce" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
            </div>

            {showMetaConfig && (
              /* Config Meta Grid */
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
              {/* Left selectors: category & priority */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400" /> 分类:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <select
                      id="category-select"
                      value={inputCategory}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setShowAddCategory(true);
                        } else {
                          setInputCategory(e.target.value);
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {categories.map(cat => {
                        const info = getCategoryTheme(cat);
                        return (
                          <option key={cat} value={cat}>
                            {info.icon} {cat}
                          </option>
                        );
                      })}
                      <option value="__new__">+ 新建分类...</option>
                    </select>
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">优先级:</span>
                  <div id="priority-selector-group" className="inline-flex rounded-lg bg-slate-100 p-0.5">
                    {(['high', 'medium', 'low'] as const).map((p) => {
                      const labels = { high: '高', medium: '中', low: '低' };
                      const isSelected = inputPriority === p;
                      const activeColors = {
                        high: 'bg-red-500 text-white shadow-xs',
                        medium: 'bg-amber-500 text-white shadow-xs',
                        low: 'bg-slate-500 text-white shadow-xs'
                      };
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setInputPriority(p)}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-150 ${
                            isSelected 
                              ? activeColors[p] 
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                          }`}
                        >
                          {labels[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Due Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> 截止时间:
                  </span>
                  <input
                    id="duedate-input"
                    type="date"
                    value={inputDueDate}
                    onChange={(e) => setInputDueDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 focus:border-blue-500 focus:outline-none cursor-pointer outline-none"
                  />
                </div>
              </div>

              {/* Progress & Color Setup Row */}
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 pt-3.5 mt-2">
                <div className="flex-1 flex items-center gap-2.5 min-w-[240px]">
                  <span className="text-xs font-medium text-slate-500 shrink-0">
                    初始进度: <span className="font-bold text-blue-600">{inputProgress}%</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={inputProgress}
                    onChange={(e) => setInputProgress(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-slate-500">进度条颜色:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: '淡紫', value: '#a855f7', bg: 'bg-purple-500' },
                      { name: '蓝色', value: '#3b82f6', bg: 'bg-blue-500' },
                      { name: '绿色', value: '#10b981', bg: 'bg-emerald-500' },
                      { name: '橙色', value: '#f59e0b', bg: 'bg-amber-500' },
                      { name: '粉色', value: '#ec4899', bg: 'bg-pink-500' }
                    ].map(col => {
                      const isSelected = inputProgressColor === col.value;
                      return (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setInputProgressColor(col.value)}
                          title={col.name}
                          className={`h-4.5 w-4.5 rounded-full ${col.bg} transition-all duration-150 transform hover:scale-110 flex items-center justify-center`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Category helper */}
              {showAddCategory && (
                <div className="w-full flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                  <span className="text-xs font-medium text-slate-500">新建分类:</span>
                  <input
                    id="new-category-input"
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="分类名称（如：灵感）"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      id="btn-save-category"
                      type="button"
                      onClick={handleCreateCategory}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      保存
                    </button>
                    <button
                      id="btn-cancel-category"
                      type="button"
                      onClick={() => setShowAddCategory(false)}
                      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}
          </form>
        </section>


        {/* --- Toolbar: Filter, Search, and Sorting Options --- */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Tabs Filter */}
          <div id="filter-tabs" className="flex border-b border-slate-200/60 p-0.5">
            {(['all', 'active', 'completed'] as const).map(f => {
              const tabLabels = { all: '全部任务', active: '未完成', completed: '已完成' };
              const tabCounts = { 
                all: counts.total, 
                active: counts.active, 
                completed: counts.completed 
              };
              const isActive = currentFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setCurrentFilter(f)}
                  className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none ${
                    isActive 
                      ? 'text-blue-600 font-bold border-b-2 border-blue-600' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tabLabels[f]}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tabCounts[f]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick controls: Search Input & Sort Selector */}
          <div className="flex flex-col gap-2 min-[420px]:flex-row sm:items-center">
            {/* Search */}
            <div id="search-bar-container" className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div id="sort-selector-container" className="flex items-center gap-1.5 justify-end">
              <span className="text-xs text-slate-400 flex items-center shrink-0">
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> 排序:
              </span>
              <select
                id="todo-sort-select"
                value={currentSort}
                onChange={(e) => setCurrentSort(e.target.value as SortType)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="date">按创建时间</option>
                <option value="priority">按优先级高低</option>
                <option value="alphabetical">按首字母 A-Z</option>
              </select>
            </div>
          </div>
        </div>


        {/* --- List Section --- */}
        <section id="todos-list-section" className="space-y-3">
          {filteredAndSortedTodos.length > 0 ? (
            filteredAndSortedTodos.map((todo) => {
              const catTheme = getCategoryTheme(todo.category);
              const priorityDetail = priorityInfo[todo.priority];
              const isEditing = editingId === todo.id;

              return (
                <div
                  id={`todo-item-${todo.id}`}
                  key={todo.id}
                  onDoubleClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Skip double-click trigger if clicking select, inputs, or buttons
                    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
                      return;
                    }
                    handleStartEdit(todo);
                  }}
                  className={`group relative flex flex-col justify-between gap-3 p-5 rounded-xl border overflow-hidden transition-all duration-200 ${
                    todo.completed
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                      : 'bg-white border-slate-100/80 text-slate-800 shadow-xs hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  
                  {/* Progress Fill Background (Requirement #4) */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-300 opacity-20" 
                    style={{ 
                      width: `${todo.progress ?? 0}%`, 
                      backgroundColor: todo.progressColor || '#8b5cf6' 
                    }}
                  />

                  {isEditing ? (
                    /* Double-click Comprehensive Editing Form */
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSaveEdit(todo.id); }}
                      className="w-full relative z-10 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          ⚡ 编辑任务属性 
                        </span>
                        <span className="text-3xs text-slate-400">（按 Enter 快速保存）</span>
                      </div>

                      {/* Name Input */}
                      <div>
                        <label className="block text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-1">任务名称</label>
                        <input
                          id={`edit-input-${todo.id}`}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full rounded-lg border border-blue-400 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
                          autoFocus
                          placeholder="任务名称"
                        />
                      </div>

                      {/* Grid parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-1">分类</label>
                          <select
                            value={editingCategory}
                            onChange={(e) => setEditingCategory(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-1">优先级</label>
                          <select
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value as 'high' | 'medium' | 'low')}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="high">🔴 高优先级</option>
                            <option value="medium">🟡 中优先级</option>
                            <option value="low">🟢 低优先级</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-1">截止日期</label>
                          <input
                            type="date"
                            value={editingDueDate}
                            onChange={(e) => setEditingDueDate(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Progress slider and selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-3xs font-semibold uppercase tracking-wider text-slate-400">完成进度: {editingProgress}%</label>
                            {editingProgress === 100 && <span className="text-[10px] text-emerald-600 font-bold">✨ 已完成</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={editingProgress}
                              onChange={(e) => setEditingProgress(parseInt(e.target.value))}
                              className="flex-1 accent-purple-600 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-1">进度背景颜色</label>
                          <div className="flex items-center gap-2">
                            {[
                              { name: '淡紫', value: '#a855f7', bg: 'bg-purple-500' },
                              { name: '蓝色', value: '#3b82f6', bg: 'bg-blue-500' },
                              { name: '绿色', value: '#10b981', bg: 'bg-emerald-500' },
                              { name: '橙色', value: '#f59e0b', bg: 'bg-amber-500' },
                              { name: '粉色', value: '#ec4899', bg: 'bg-pink-500' }
                            ].map(col => {
                              const isSelected = editingProgressColor === col.value;
                              return (
                                <button
                                  key={col.value}
                                  type="button"
                                  onClick={() => setEditingProgressColor(col.value)}
                                  title={col.name}
                                  className={`h-4.5 w-4.5 rounded-full ${col.bg} transition-all duration-150 transform hover:scale-110 flex items-center justify-center`}
                                >
                                  {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Save/Cancel Controls */}
                      <div className="flex justify-end gap-2 border-t border-slate-150 pt-2 pb-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg transition"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg transition"
                        >
                          保存修改
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Display Standard View: Formatted on a single row for high-efficiency density (Requirement #2) */
                    <div className="relative z-10 flex flex-row items-center justify-between gap-3 w-full flex-wrap md:flex-nowrap">
                      {/* Left side: Checkbox + Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Circle Custom Checkbox */}
                        <button
                          id={`checkbox-toggle-${todo.id}`}
                          type="button"
                          onClick={() => handleToggleTodo(todo.id)}
                          className="shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-full"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className={`h-5 w-5 text-blue-500 hover:text-blue-600 transition-colors duration-150 ${todo.progress === 100 ? 'anim-dazzle' : ''}`} />
                          ) : (
                            <Circle className={`h-5 w-5 text-slate-300 hover:text-blue-500 transition-colors duration-150 ${todo.progress === 100 ? 'anim-dazzle' : ''}`} />
                          )}
                        </button>

                        {/* Todo Text Content */}
                        <div className="min-w-0 flex-1">
                          <p 
                            title="双击即可修改任务名称、分类、优先级和截止时间"
                            className={`text-sm md:text-[15px] font-semibold leading-relaxed break-all select-none cursor-pointer ${
                              todo.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800'
                            }`}
                          >
                            {todo.text}
                          </p>
                        </div>
                      </div>

                      {/* Right side: badges & actions unified in the same row */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-auto sm:flex-nowrap">
                        {/* Priority Badge */}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold tracking-wide shrink-0 ${priorityDetail.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityDetail.dot}`}></span>
                          {priorityDetail.label}
                        </span>

                        {/* Category Label */}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold shrink-0 ${catTheme.color}`}>
                          <span>{catTheme.icon}</span>
                          <span>{todo.category}</span>
                        </span>

                        {/* Progress Percentage Badge (Requirement #4) */}
                        <span 
                          className="inline-flex items-center gap-1 rounded-full border border-slate-150 px-2 py-0.5 text-2xs font-bold bg-white text-slate-600 shadow-3xs shrink-0"
                          style={{ borderLeft: `3px solid ${todo.progressColor || '#8b5cf6'}` }}
                        >
                          进度: {todo.progress ?? 0}%
                        </span>

                        {/* Due Date Badge */}
                        {(() => {
                          const dueInfo = getDueDateStatus(todo.dueDate, todo.completed);
                          if (!dueInfo) return null;
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold shrink-0 ${dueInfo.style}`}>
                              {dueInfo.label}
                            </span>
                          );
                        })()}

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-1 border-l border-slate-100 pl-1.5">
                          <button
                            id={`btn-edit-${todo.id}`}
                            onClick={() => handleStartEdit(todo)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all focus:outline-none"
                            title="修改任务属性 (双击任务卡也可以编辑)"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          
                          <button
                            id={`btn-delete-${todo.id}`}
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all focus:outline-none"
                            title="删除事项"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            // --- Empty State ---
            <div id="todo-empty-state" className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-16 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-4 ring-8 ring-blue-50/20">
                {searchQuery ? (
                  <Search className="h-6 w-6 stroke-[1.5]" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 stroke-[1.5]" />
                )}
              </span>
              <h3 className="text-sm font-semibold text-slate-700">
                {searchQuery ? '没有找到匹配的任务' : '万事俱备，一身轻松'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-[280px]">
                {searchQuery 
                  ? '请尝试换一个关键词进行搜索' 
                  : (currentFilter === 'completed' 
                    ? '你还没有完成任何任务，加油噢！' 
                    : '目前没有待办事务，点击上面输入框开始添加吧。'
                  )
                }
              </p>
              {searchQuery && (
                <button
                  id="btn-clear-search-empty"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  清除搜索
                </button>
              )}
            </div>
          )}
        </section>

        {/* --- Batch Actions Footer --- */}
        {counts.completed > 0 && (
          <div id="batch-actions-footer" className="mt-6 flex justify-end">
            <button
              id="btn-clear-completed"
              onClick={handleClearCompleted}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-xs px-4 py-2.5 transition-all duration-200 focus:outline-none cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>清理所有已完成任务</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
