import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/6267064765221899735-removebg-preview_1759543320279.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "lajnah" && password === "lajnah2025") {
      localStorage.setItem("isAuthenticated", "true");
      setLocation("/");
      toast({
        title: "Berhasil",
        description: "Login berhasil"
      });
    } else {
      toast({
        title: "Gagal",
        description: "Username atau password salah",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-white p-3 flex items-center justify-center overflow-hidden">
              <img 
                src={logoImage} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-full"
                data-testid="img-login-logo"
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold" data-testid="text-app-title">Tahfidz App</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-institution-name">
                Ma'had Alfaruq Assalafy litahtidzil quran kalibagor
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                data-testid="input-username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                data-testid="input-password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              data-testid="button-login"
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
