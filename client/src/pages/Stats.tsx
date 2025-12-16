import { useGame } from "@/components/GameContext";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp, ArrowLeft } from "lucide-react";

export default function Stats() {
  const { user } = useGame();
  const [, setLocation] = useLocation();

  if (!user) return <div>Access Denied</div>;

  const mockScore = user.mockBoardScore !== null ? user.mockBoardScore.toFixed(1) : "N/A";
  
  // Prepare chart data
  const data = user.standardGameScores.map((score, index) => ({
    attempt: `Game ${index + 1}`,
    score: score,
  }));

  const averageScore = user.standardGameScores.length > 0 
    ? (user.standardGameScores.reduce((a, b) => a + b, 0) / user.standardGameScores.length).toFixed(1) 
    : "0";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-serif font-bold">Your Statistics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standard Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}</div>
            <p className="text-xs text-muted-foreground">Points per game</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.standardGameScores.length}</div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mock Board Rating</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockScore}%</div>
            <p className="text-xs text-muted-foreground">
              {user.mockBoardScore !== null && user.mockBoardScore >= 75 ? "Passing" : "Needs Improvement"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="attempt" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px' }} 
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground">
               No game data yet. Play a game to see your stats!
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
