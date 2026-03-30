import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardContent } from "./components/DashboardContent";
import { Tasks } from "./components/Tasks";
import { AIAssistant } from "./components/AIAssistant";
import { Home } from "./pages/Home";
import { DenaPaona } from "./pages/DenaPaona";
import { IncomeExpense } from "./pages/IncomeExpense";
import { Savings } from "./pages/Savings";
import { Notebook } from "./pages/Notebook";
import { MarketCalculator } from "./pages/MarketCalculator";
import { Ford } from "./pages/Ford";
import { Alarm } from "./pages/Alarm";
import { Calculator } from "./pages/Calculator";
import { TakaGunun } from "./pages/TakaGunun";
import { Settings } from "./pages/Settings";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Login } from "./components/Login";

function AppContent() {
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-purple-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div></div>;
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home onNavigate={setActiveTab} />;
      case "dena-paona":
        return <DenaPaona onBack={() => setActiveTab("home")} />;
      case "income-expense":
        return <IncomeExpense onBack={() => setActiveTab("home")} />;
      case "savings":
        return <Savings onBack={() => setActiveTab("home")} />;
      case "notes":
        return <Notebook onBack={() => setActiveTab("home")} />;
      case "market-calculator":
        return <MarketCalculator onBack={() => setActiveTab("home")} />;
      case "ford":
        return <Ford onBack={() => setActiveTab("home")} />;
      case "taka-gunun":
        return <TakaGunun onBack={() => setActiveTab("home")} />;
      case "alarm":
        return <Alarm onBack={() => setActiveTab("home")} />;
      case "calculator":
        return <Calculator onBack={() => setActiveTab("home")} />;
      case "settings":
        return <Settings onBack={() => setActiveTab("home")} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      case "dashboard":
        return <DashboardContent />;
      case "tasks":
        return <Tasks />;
      case "ai":
        return <AIAssistant />;
      default:
        return (
          <div className="p-8 flex items-center justify-center h-full text-muted-foreground">
            <p>Content for {activeTab} is coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="hidden md:block">
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} setActiveTab={setActiveTab} />
        </div>
        
        <main className="flex-1 overflow-y-auto bg-background md:p-4 lg:p-6">
          <div className="h-full w-full md:max-w-[400px] mx-auto bg-gray-50 md:rounded-[2.5rem] md:shadow-2xl overflow-hidden md:border-[8px] border-gray-800 relative">
            <div className="h-full overflow-y-auto custom-scrollbar">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
