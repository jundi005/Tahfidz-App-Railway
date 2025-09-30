import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface HafalanChartProps {
  data: {
    bulan: string;
    mutawassitoh: number;
    aliyah: number;
  }[];
}

export default function HafalanChart({ data }: HafalanChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rata-rata Hafalan per Bulan (Juz)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="bulan" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Line type="monotone" dataKey="mutawassitoh" stroke="hsl(var(--chart-2))" name="Mutawassitoh" strokeWidth={2} />
            <Line type="monotone" dataKey="aliyah" stroke="hsl(var(--chart-1))" name="Aliyah" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
