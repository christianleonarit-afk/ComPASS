import { LEADERBOARD_DATA } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Medal } from "lucide-react";

export default function Leaderboard() {
  // Sort by score descending
  const sortedData = [...LEADERBOARD_DATA].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-display font-bold text-primary">Leaderboard</h1>
        <p className="text-muted-foreground font-serif italic">Top performing future librarians</p>
      </div>

      <Card className="border-primary/20 shadow-xl bg-card/50 backdrop-blur">
        <CardHeader>
           <CardTitle>Global Rankings</CardTitle>
           <CardDescription>Based on Mock Board Examination Scores</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((entry, index) => (
                <TableRow key={entry.id} className={index < 3 ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">
                    {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
                    {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                    {index === 2 && <Medal className="h-5 w-5 text-amber-700" />}
                    {index > 2 && `#${index + 1}`}
                  </TableCell>
                  <TableCell className="font-semibold">{entry.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {entry.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    {entry.score}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
