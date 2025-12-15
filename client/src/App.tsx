import { Switch, Route } from "wouter";
import { GameProvider } from "./components/GameContext";
import Layout from "./components/Layout";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import MockBoard from "./pages/MockBoard";
import Admin from "./pages/Admin";
import Stats from "./pages/Stats";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/not-found";

function App() {
  return (
    <GameProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/game" component={Game} />
          <Route path="/mock-board" component={MockBoard} />
          <Route path="/admin" component={Admin} />
          <Route path="/stats" component={Stats} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster />
    </GameProvider>
  );
}

export default App;
