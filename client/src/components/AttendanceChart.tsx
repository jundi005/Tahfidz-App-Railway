import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AttendanceChartProps {
  data: {
    name: string;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    terlambat: number;
  }[];
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Kehadiran Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Bar dataKey="hadir" fill="hsl(var(--chart-1))" name="Hadir" />
            <Bar dataKey="sakit" fill="hsl(var(--chart-3))" name="Sakit" />
            <Bar dataKey="izin" fill="hsl(var(--chart-2))" name="Izin" />
            <Bar dataKey="alpa" fill="hsl(var(--destructive))" name="Alpa" />
            <Bar dataKey="terlambat" fill="hsl(var(--chart-4))" name="Terlambat" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
