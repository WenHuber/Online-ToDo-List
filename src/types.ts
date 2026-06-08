export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  createdAt: string;
  dueDate?: string;
  progress: number; // 0 to 100
  progressColor?: string; // hex or tailwind class
}

export type FilterType = 'all' | 'active' | 'completed';
export type SortType = 'date' | 'priority' | 'alphabetical';
