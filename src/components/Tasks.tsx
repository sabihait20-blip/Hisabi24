import { useState } from "react";
import { motion } from "motion/react";
import { Plus, MoreVertical, Calendar, CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

const initialTasks: Task[] = [
  { id: "1", title: "Review Q3 Marketing Strategy", category: "Marketing", dueDate: "Today", completed: false, priority: "High" },
  { id: "2", title: "Update User Onboarding Flow", category: "Product", dueDate: "Tomorrow", completed: false, priority: "Medium" },
  { id: "3", title: "Prepare Board Meeting Slides", category: "Management", dueDate: "Oct 15", completed: true, priority: "High" },
  { id: "4", title: "Fix Navigation Bug on Mobile", category: "Engineering", dueDate: "Today", completed: false, priority: "High" },
  { id: "5", title: "Write Blog Post on AI Trends", category: "Content", dueDate: "Oct 18", completed: false, priority: "Low" },
];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-500 bg-red-500/10";
      case "Medium": return "text-yellow-500 bg-yellow-500/10";
      case "Low": return "text-green-500 bg-green-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
          <p className="text-sm text-muted-foreground mt-1">You have {tasks.filter(t => !t.completed).length} pending tasks</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={20} />
          New Task
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-6 md:col-span-5">Task Name</div>
          <div className="col-span-3 hidden md:block">Category</div>
          <div className="col-span-3 md:col-span-2">Due Date</div>
          <div className="col-span-3 md:col-span-2">Priority</div>
        </div>

        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors ${task.completed ? 'opacity-60' : ''}`}
            >
              <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`shrink-0 transition-colors ${task.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <span className={`font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </span>
              </div>
              
              <div className="col-span-3 hidden md:flex items-center">
                <span className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {task.category}
                </span>
              </div>
              
              <div className="col-span-3 md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={16} />
                <span className="truncate">{task.dueDate}</span>
              </div>
              
              <div className="col-span-2 md:col-span-1 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              <div className="col-span-1 flex justify-end">
                <button className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
